import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    return html;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Extract all image URLs from HTML
function extractImages(html: string): string[] {
  const imgs: string[] = [];
  const re = /<img[^>]+(?:src|data-src)="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1] && !m[1].includes("svg") && !m[1].includes("logo") && !m[1].includes("icon") && !m[1].includes("flag") && !m[1].includes("pixel") && !m[1].includes("1x1")) {
      imgs.push(m[1]);
    }
  }
  return imgs;
}

// Extract YouTube video URLs
function extractVideos(html: string): string[] {
  const vids: string[] = [];
  const re = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    vids.push(`https://www.youtube.com/embed/${m[1]}`);
  }
  return [...new Set(vids)];
}

// ── WECHAMP - extract structured data ──
function parseWechamp(html: string): { found: boolean; photo_url?: string; role?: string; biography?: string; themes?: string[]; faits?: string[]; videos?: string[]; images?: string[] } {
  const r: any = { found: false };
  
  // Check if it's a 404
  if (html.includes("error404") || html.includes("La page que vous cherchez") || html.length < 2000) return r;
  r.found = true;

  // Photo - og:image or main speaker image
  const ogImg = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (ogImg) r.photo_url = ogImg[1];
  
  // Also look for speaker-specific images in content
  const contentImages = html.match(/wp-content\/uploads\/[^"]+(?:conferencier|athlete|speaker)[^"]+\.(?:webp|jpg|png|jpeg)/gi);
  if (contentImages && !r.photo_url) r.photo_url = `https://www.wechamp-entreprise.co/${contentImages[0]}`;

  // Role / subtitle
  const sub = html.match(/<(?:p\s+class="subtitle"|h2[^>]*>)[^<]*(?:champion|expert|entrepreneur|auteur|sportif|athlète|directeur|fondateur|président|médaillé|conférencier)[^<]*/i);
  if (sub) r.role = stripHtml(sub[0]);
  // Also try the first h2 after main image
  if (!r.role) {
    const h2Match = html.match(/<h2[^>]*>\s*([^<]+)<\/h2>/i);
    if (h2Match) r.role = stripHtml(h2Match[1]);
  }

  // Biography - extract all text between "Biographie" section and next major section
  const bioStart = html.search(/id="biographie"|Biographie<\/h/i);
  if (bioStart > -1) {
    const bioSection = html.substring(bioStart, bioStart + 15000);
    // Find the biography text content - everything between the bio heading and "Actualités" or "Faits marquants" or next section
    const bioEnd = bioSection.search(/id="performance"|id="medias"|id="reviews"|id="speaker_contact"|Actualités|Faits marquants<\/h|class="speaker-reviews"/i);
    const bioContent = bioEnd > -1 ? bioSection.substring(0, bioEnd) : bioSection.substring(0, 8000);
    r.biography = stripHtml(bioContent);
  }
  
  // If no bio section found, try the main description paragraph
  if (!r.biography) {
    const descMatch = html.match(/<div[^>]*class="[^"]*speaker[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) r.biography = stripHtml(descMatch[1]);
  }

  // Themes
  const themeLinks = html.match(/\/theme\/([^/"]+)/gi);
  if (themeLinks) {
    r.themes = [...new Set(themeLinks.map((t: string) => {
      const name = t.replace(/\/theme\//i, "").replace(/\//g, "").replace(/-/g, " ");
      return name.charAt(0).toUpperCase() + name.slice(1);
    }))];
  }

  // Faits marquants
  const faitsStart = html.search(/id="performance"|Faits marquants/i);
  if (faitsStart > -1) {
    const faitsSection = html.substring(faitsStart, faitsStart + 3000);
    const liMatches = faitsSection.match(/<li[^>]*>([^<]+)<\/li>/gi);
    if (liMatches) {
      r.faits = liMatches.map((li: string) => stripHtml(li)).filter((f: string) => f.length > 3);
    }
  }

  // Videos
  r.videos = extractVideos(html);
  r.images = extractImages(html);

  return r;
}

// ── SIMONE ET NELSON ──
function parseSimoneNelson(html: string): { found: boolean; photo_url?: string; role?: string; biography?: string; themes?: string[]; images?: string[] } {
  const r: any = { found: false };
  
  if (html.includes("Page non trouvée") || html.length < 2000) return r;

  // Photo - og:image
  const ogImg = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (ogImg) { r.found = true; r.photo_url = ogImg[1]; }
  
  // Also look for portrait image
  const portraitImg = html.match(/wp-content\/uploads\/[^"]+(?:Portrait|portrait)[^"]+\.(?:png|jpg|jpeg|webp)/i);
  if (portraitImg) { r.found = true; r.photo_url = `https://simoneetnelson.com/${portraitImg[0]}`; }

  // Role - flip-box or subtitle
  const roleM = html.match(/flip-box__layer__description">\s*([\s\S]*?)\s*<\/div>/i);
  if (roleM) { r.found = true; r.role = stripHtml(roleM[1]); }
  // Try alternative: text right after the name heading
  if (!r.role) {
    const altRole = html.match(/<h1[^>]*>[^<]+<\/h1>\s*(?:<[^>]+>)*\s*([^<]{10,100})/i);
    if (altRole) { r.found = true; r.role = stripHtml(altRole[1]); }
  }

  // Biography - extract from "Biographie" section
  const bioStart = html.search(/Biographie|biographie/i);
  if (bioStart > -1) {
    r.found = true;
    const bioSection = html.substring(bioStart, bioStart + 10000);
    // End at "en photos" or "en vidéos" or "témoignages" or "Profils similaires"
    const bioEnd = bioSection.search(/en photos|en vidéos|témoignages|Profils similaires|CONFIEZ-NOUS/i);
    const bioContent = bioEnd > -1 ? bioSection.substring(0, bioEnd) : bioSection.substring(0, 5000);
    r.biography = stripHtml(bioContent);
  }

  // If still no biography, get the intro paragraph
  if (!r.biography || r.biography.length < 50) {
    // Look for the intro text after the name
    const introM = html.match(/<p[^>]*>\s*(?:Ancien|Ancienne|Né|Née|Champion|Championne|Expert|Experte|Entrepreneur|Fondateur|Fondatrice|Directeur|Directrice)[^<]{20,500}<\/p>/i);
    if (introM) { r.found = true; r.biography = stripHtml(introM[0]); }
  }

  // Themes
  const themeLinks = html.match(/\/thematique\/([^/"]+)/gi);
  if (themeLinks) {
    r.found = true;
    r.themes = themeLinks.map((t: string) => {
      const name = t.replace(/\/thematique\//i, "").replace(/\//g, "").replace(/-/g, " ");
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
  }

  // Images from photos section
  r.images = extractImages(html);

  return r;
}

// ── ORATORS.FR ──
function parseOrators(html: string): { found: boolean; photo_url?: string; role?: string; biography?: string; conferences?: string[]; themes?: string[]; languages?: string[]; videos?: string[] } {
  const r: any = { found: false };
  if (!html.includes("woocommerce") && !html.includes("product_title") && !html.includes("orators")) return r;
  
  // Check for 404
  if (html.includes("error-404") || html.length < 2000) return r;
  r.found = true;

  const og = html.match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (og) r.photo_url = og[1];

  // Role
  const roleM = html.match(/ast-woo-shop-product-description">\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (roleM) r.role = stripHtml(roleM[1]);

  // Biography - get text from "Présentation" section
  const presStart = html.search(/Présentation|présentation/i);
  if (presStart > -1) {
    const presSection = html.substring(presStart, presStart + 10000);
    const presEnd = presSection.search(/Extrait vidéo|Contacter|class="related"/i);
    const presContent = presEnd > -1 ? presSection.substring(0, presEnd) : presSection.substring(0, 5000);
    r.biography = stripHtml(presContent);
  }

  // Conferences
  const confStart = html.search(/Les conférences de|Ses conférences/i);
  if (confStart > -1) {
    const confSection = html.substring(confStart, confStart + 5000);
    const items = confSection.match(/<li>([^<]+)<\/li>/gi);
    if (items) r.conferences = items.map((li: string) => stripHtml(li)).filter((t: string) => t.length > 3);
  }

  // Themes
  const cats = html.match(/product_cat-([a-z0-9-]+)/gi);
  if (cats) r.themes = [...new Set(cats.map((c: string) => c.replace("product_cat-", "").replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())))];

  r.videos = extractVideos(html);

  // Languages
  const langSec = html.match(/Langues parlées[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (langSec) {
    const ls = langSec[1].match(/<li>([^<]+)<\/li>/gi);
    if (ls) r.languages = ls.map((l: string) => stripHtml(l));
  }

  return r;
}

// ── AI SYNTHESIS ──
async function synthesizeWithAI(name: string, sources: any[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("No LOVABLE_API_KEY");
    return null;
  }

  const foundSources = sources.filter((s) => s.found);
  if (foundSources.length === 0) return null;

  const sourcesText = foundSources.map((s) => {
    let t = `\n=== SOURCE: ${s.source} ===\n`;
    if (s.role) t += `Rôle/Titre: ${s.role}\n`;
    if (s.biography) t += `Biographie complète:\n${s.biography.substring(0, 5000)}\n`;
    if (s.conferences?.length) t += `Conférences: ${s.conferences.join(" | ")}\n`;
    if (s.themes?.length) t += `Thèmes: ${s.themes.join(", ")}\n`;
    if (s.faits?.length) t += `Faits marquants: ${s.faits.join(" | ")}\n`;
    if (s.languages?.length) t += `Langues: ${s.languages.join(", ")}\n`;
    return t;
  }).join("\n");

  const prompt = `Tu es un rédacteur expert en fiches de conférenciers professionnels pour une agence de booking.

DONNÉES BRUTES trouvées pour "${name}" :
${sourcesText}

CRÉE UNE FICHE COMPLÈTE en JSON avec cette structure EXACTE. Inspire-toi de ce modèle de qualité (Régis Rossi) :

EXEMPLE DE BIOGRAPHIE DE QUALITÉ :
"<p>Titulaire d'un <strong>DESS en Stratégie et Communication</strong>, a accompagné des décideurs de grands groupes durant une <strong>quinzaine d'années</strong> dans les domaines du <strong>marketing, du management et de la communication</strong>.</p>
<p>Parallèlement à cette carrière, il a pratiqué l'illusion sous toutes ses formes :</p>
<ul><li><strong>Close-up</strong></li><li><strong>Mentalisme</strong></li></ul>
<p>En <strong>2011</strong>, il fonde sa société et propose aux entreprises un concept novateur.</p>"

RÈGLES BIOGRAPHIE :
- NE commence JAMAIS par le prénom ou le nom du conférencier. Commence directement par un titre, une qualité ou "Né(e) en..."
- HTML riche avec <p>, <strong>, <ul><li>
- Met en <strong> : dates, chiffres clés, titres/prix, institutions prestigieuses, mots-clés importants
- 4-7 paragraphes structurés chronologiquement
- Utilise des listes <ul><li> pour énumérer des éléments (palmarès, domaines, etc.)
- Ton professionnel mais engageant

RÈGLES CONFÉRENCES :
- Crée 1 à 3 conférences thématiques pertinentes basées sur les infos trouvées
- Chaque conférence a un titre accrocheur et une description HTML détaillée (2-3 paragraphes)
- La description doit expliquer le contenu, les enseignements et la valeur ajoutée

RÈGLES KEY_POINTS :
- 3-5 points forts factuels et percutants (titres, palmarès, distinctions, chiffres)

JSON ATTENDU :
{
  "name": "Prénom Nom",
  "role": "Titre professionnel court (ex: Double Champion Olympique de Judo)",
  "specialty": "Phrase d'accroche courte pour la carte (max 8 mots)",
  "biography": "HTML riche...",
  "themes": ["Thème 1", "Thème 2", "Thème 3"],
  "conferences": [
    {"title": "Titre accrocheur", "description": "HTML riche avec <p> et <strong>"}
  ],
  "languages": ["Français"],
  "gender": "male ou female",
  "key_points": ["Point fort 1", "Point fort 2"]
}

IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans commentaire ni backtick.`;

  try {
    const resp = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
      }),
    });
    if (!resp.ok) {
      console.error("AI API error:", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Extract JSON from response (handle potential markdown wrapping)
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", content.substring(0, 200));
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("AI synthesis error:", err);
    return null;
  }
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

    // Check if speaker already exists
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existing } = await supabase.from("speakers").select("id, name, slug").or(`slug.eq.${slug},name.ilike.%${name.trim()}%`).limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: false, error: `Ce conférencier existe déjà : ${existing[0].name}`, existing: existing[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all 3 sources in parallel
    console.log("Fetching sources...");
    const [oratorsHtml, wechampHtml, simoneHtml] = await Promise.all([
      fetchPage(`https://orators.fr/les-intervenants/${slug}/`),
      fetchPage(`https://www.wechamp-entreprise.co/conferencier/${slug}/`),
      fetchPage(`https://simoneetnelson.com/annuaire/conferenciers/${slug}/`),
    ]);

    console.log(`Fetched: orators=${!!oratorsHtml}, wechamp=${!!wechampHtml}, simone=${!!simoneHtml}`);

    // Parse each source
    const orators = oratorsHtml ? parseOrators(oratorsHtml) : { source: "orators.fr", found: false };
    const wechamp = wechampHtml ? parseWechamp(wechampHtml) : { source: "wechamp-entreprise.co", found: false };
    const simone = simoneHtml ? parseSimoneNelson(simoneHtml) : { source: "simoneetnelson.com", found: false };

    // Add source names
    orators.source = "orators.fr";
    wechamp.source = "wechamp-entreprise.co";
    simone.source = "simoneetnelson.com";

    const sources = [orators, wechamp, simone];
    const found = sources.filter((s) => s.found);
    console.log(`Found on ${found.length} source(s): ${found.map(s => s.source).join(", ")}`);
    
    // Log what data was extracted
    found.forEach(s => {
      console.log(`  ${s.source}: bio=${(s.biography || "").length}c, role="${s.role || ""}", themes=${(s.themes || []).length}, faits=${(s.faits || []).length}`);
    });

    if (found.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Ce profil n'existe pas chez les concurrents.",
        sources: sources.map((s) => ({ source: s.source, found: false })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get the best photo URL
    const bestPhoto = found.find((s) => s.photo_url)?.photo_url || null;

    // Get video URL
    const videoUrl = found.find((s) => s.videos?.length)?.videos?.[0] || null;

    // Synthesize with AI
    console.log("Synthesizing with AI...");
    const aiProfile = await synthesizeWithAI(name, sources);
    
    if (aiProfile) {
      console.log(`AI synthesis OK: bio=${(aiProfile.biography || "").length}c, conferences=${(aiProfile.conferences || []).length}, key_points=${(aiProfile.key_points || []).length}`);
    } else {
      console.log("AI synthesis failed, using raw data");
    }

    // Build final profile
    const profile = {
      name: aiProfile?.name || name.trim().split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
      slug,
      role: aiProfile?.role || found.find((s) => s.role)?.role || null,
      specialty: aiProfile?.specialty || null,
      biography: aiProfile?.biography || found.find((s) => s.biography)?.biography || null,
      themes: aiProfile?.themes?.length ? aiProfile.themes : [...new Set(found.flatMap((s) => s.themes || []))],
      conferences: aiProfile?.conferences || [],
      languages: aiProfile?.languages || found.find((s) => s.languages)?.languages || ["Français"],
      gender: aiProfile?.gender || "male",
      key_points: aiProfile?.key_points || found.find((s) => s.faits)?.faits || [],
      photo_url: bestPhoto,
      video_url: videoUrl,
      sources: sources.map((s) => ({ source: s.source, found: s.found, photo_url: s.photo_url || null })),
    };

    return new Response(JSON.stringify({ success: true, profile }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
