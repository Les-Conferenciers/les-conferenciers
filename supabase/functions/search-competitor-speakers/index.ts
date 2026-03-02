import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "text/html" },
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    if (html.includes("Page non trouvée") || (html.includes("404") && html.includes("introuvable"))) return null;
    return html;
  } catch { return null; }
}

function stripHtml(html: string): string {
  return html.replace(new RegExp("<[^>]+>", "g"), " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/\s+/g, " ").trim();
}

function cleanBioHtml(html: string): string {
  const divRe = new RegExp("</?(?:div|section|article|span)[^>]*>", "gi");
  const tagRe = new RegExp("<(?!/?(?:p|strong|em|ul|li|br|a)\\b)[^>]+>", "gi");
  return html.replace(divRe, "").replace(tagRe, "").trim();
}

function extractBetween(html: string, startRe: RegExp, endRe: RegExp): string | null {
  const m = html.match(startRe);
  if (!m || m.index === undefined) return null;
  const rest = html.substring(m.index + m[0].length);
  const endM = rest.match(endRe);
  return rest.substring(0, endM ? endM.index : Math.min(rest.length, 5000));
}

// ── ORATORS.FR ──
function parseOrators(html: string) {
  const r: any = { source: "orators.fr", found: false };
  if (!html.includes("woocommerce") && !html.includes("product_title")) return r;
  r.found = true;

  const og = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (og) r.photo_url = og[1];

  const roleM = html.match(/ast-woo-shop-product-description">\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (roleM) r.role = stripHtml(roleM[1]);

  const bio = extractBetween(html, /Présentation/i, new RegExp("<h[23]|Extrait vidéo|Contacter", "i"));
  if (bio) r.biography = cleanBioHtml(bio);

  const confSection = extractBetween(html, /Les conférences de/i, /Présentation/i);
  if (confSection) {
    const items = confSection.match(new RegExp("<li>([\\s\\S]*?)</li>", "gi"));
    if (items) r.conferences = items.map((li: string) => stripHtml(li)).filter((t: string) => t.length > 3);
  }

  const cats = html.match(/product_cat-([a-z0-9-]+)/gi);
  if (cats) r.themes = [...new Set(cats.map((c: string) => c.replace("product_cat-", "").replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())))];

  const vid = html.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (vid) r.video_url = "https://www.youtube.com/watch?v=" + vid[1];

  const langSec = html.match(/Langues parlées[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (langSec) {
    const ls = langSec[1].match(new RegExp("<li>([\\s\\S]*?)</li>", "gi"));
    if (ls) r.languages = ls.map((l: string) => stripHtml(l));
  }
  return r;
}

// ── WECHAMP ──
function parseWechamp(html: string) {
  const r: any = { source: "wechamp-entreprise.co", found: false };
  if (html.includes("error404") || html.includes("La page que vous cherchez")) return r;
  r.found = true;

  const og = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (og) r.photo_url = og[1];
  const bgImg = html.match(/background:\s*url\('([^']+)'\)/i);
  if (bgImg && !r.photo_url) r.photo_url = bgImg[1];

  const sub = html.match(/<p class="subtitle">([\s\S]*?)<\/p>/i);
  if (sub) r.role = stripHtml(sub[1]);

  const bio = extractBetween(html, /Biographie|Sa biographie|À propos/i, new RegExp("<h[23]|conference|theme", "i"));
  if (bio) r.biography = cleanBioHtml(bio);

  return r;
}

// ── SIMONE ET NELSON ──
function parseSimoneNelson(html: string) {
  const r: any = { source: "simoneetnelson.com", found: false };
  if (html.includes("Page non trouvée")) return r;

  const og = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (og) { r.found = true; r.photo_url = og[1]; }

  const roleM = html.match(/flip-box__layer__description">\s*([\s\S]*?)\s*<\/div>/i);
  if (roleM) { r.found = true; r.role = stripHtml(roleM[1]); }

  const bio = extractBetween(html, /Biographie|Présentation/i, new RegExp("<h[23]|conference|<footer", "i"));
  if (bio) { r.found = true; r.biography = cleanBioHtml(bio); }

  return r;
}

async function synthesizeWithAI(name: string, sources: any[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const sourcesText = sources.filter((s) => s.found).map((s) => {
    let t = `\n=== ${s.source} ===\n`;
    if (s.role) t += `Rôle: ${s.role}\n`;
    if (s.biography) t += `Bio: ${stripHtml(s.biography).substring(0, 3000)}\n`;
    if (s.conferences) t += `Conférences: ${s.conferences.join(", ")}\n`;
    if (s.themes) t += `Thèmes: ${s.themes.join(", ")}\n`;
    if (s.languages) t += `Langues: ${s.languages.join(", ")}\n`;
    return t;
  }).join("\n");

  const prompt = `Tu es un expert en création de fiches de conférenciers professionnels.
À partir des données trouvées pour "${name}", crée une fiche complète en JSON :

${sourcesText}

JSON attendu :
{"name":"...","role":"Titre pro concis","specialty":"Max 8 mots pour la carte","biography":"HTML riche avec <p> et <strong>. 3-5 paragraphes. Ne commence PAS par le nom.","themes":["..."],"conferences":[{"title":"...","description":"HTML riche"}],"languages":["Français"],"gender":"male ou female","key_points":["..."]}

IMPORTANT : biographie originale, <strong> sur chiffres/titres/prix. Réponds UNIQUEMENT avec le JSON.`;

  try {
    const resp = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }], temperature: 0.7 }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name } = await req.json();
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({ success: false, error: "Nom requis (min 2 caractères)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slug = slugify(name.trim());
    console.log(`Searching "${name}" → slug: ${slug}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await supabase.from("speakers").select("id, name, slug").or(`slug.eq.${slug},name.ilike.%${name.trim()}%`).limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: false, error: `Ce conférencier existe déjà : ${existing[0].name}`, existing: existing[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [oratorsHtml, wechampHtml, simoneHtml] = await Promise.all([
      fetchPage(`https://orators.fr/les-intervenants/${slug}/`),
      fetchPage(`https://www.wechamp-entreprise.co/conferencier/${slug}/`),
      fetchPage(`https://simoneetnelson.com/annuaire/conferenciers/${slug}/`),
    ]);

    const sources = [
      oratorsHtml ? parseOrators(oratorsHtml) : { source: "orators.fr", found: false },
      wechampHtml ? parseWechamp(wechampHtml) : { source: "wechamp-entreprise.co", found: false },
      simoneHtml ? parseSimoneNelson(simoneHtml) : { source: "simoneetnelson.com", found: false },
    ];

    const found = sources.filter((s) => s.found);
    console.log(`Found on ${found.length} source(s)`);

    if (found.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Ce profil n'existe pas chez les concurrents.", sources: sources.map((s) => ({ source: s.source, found: false })) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bestPhoto = found.find((s) => s.photo_url)?.photo_url || null;
    const aiProfile = await synthesizeWithAI(name, sources);

    const profile = {
      name: aiProfile?.name || name.trim(),
      slug,
      role: aiProfile?.role || found.find((s) => s.role)?.role || null,
      specialty: aiProfile?.specialty || null,
      biography: aiProfile?.biography || found.find((s) => s.biography)?.biography || null,
      themes: aiProfile?.themes || [...new Set(found.flatMap((s) => s.themes || []))],
      conferences: aiProfile?.conferences || found.flatMap((s) => (s.conferences || []).map((c: string) => ({ title: c, description: "" }))),
      languages: aiProfile?.languages || found.find((s) => s.languages)?.languages || ["Français"],
      gender: aiProfile?.gender || "male",
      key_points: aiProfile?.key_points || [],
      photo_url: bestPhoto,
      video_url: found.find((s) => s.video_url)?.video_url || null,
      sources: sources.map((s) => ({ source: s.source, found: s.found, photo_url: s.photo_url || null })),
    };

    return new Response(JSON.stringify({ success: true, profile }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
