import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    // Check for 404 patterns
    if (html.includes("Page non trouvée") || html.includes("404") && html.includes("introuvable")) return null;
    return html;
  } catch {
    return null;
  }
}

function extractText(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractCleanHtml(html: string, startPattern: RegExp, endPattern: RegExp): string | null {
  const startMatch = html.match(startPattern);
  if (!startMatch) return null;
  const startIdx = startMatch.index! + startMatch[0].length;
  const remaining = html.substring(startIdx);
  const endMatch = remaining.match(endPattern);
  if (!endMatch) return remaining.substring(0, 5000);
  return remaining.substring(0, endMatch.index);
}

// ── ORATORS.FR ──
function parseOrators(html: string, name: string) {
  const result: any = { source: "orators.fr", found: false };

  // Check if it's a valid page (not 404)
  if (!html.includes("woocommerce-product") && !html.includes("product_title")) return result;
  result.found = true;

  // Photo
  const photoMatch = html.match(/<img[^>]+class=\"[^\"]*wp-post-image[^\"]*\"[^>]+src=\"([^\"]+)\"/i) ||
    html.match(/<img[^>]+src=\"([^\"]+)\"[^>]+class=\"[^\"]*wp-post-image[^\"]*\"/i) ||
    html.match(/<div class=\"astra-shop-thumbnail-wrap\">[\s\S]*?<img[^>]+src=\"([^\"]+)\"/i);
  if (photoMatch) result.photo_url = photoMatch[1];

  // Also try OG image
  const ogImage = html.match(/<meta property=\"og:image\"[^>]+content=\"([^\"]+)\"/i);
  if (ogImage && !result.photo_url) result.photo_url = ogImage[1];

  // Title/role
  const roleMatch = html.match(/<div class=\"ast-woo-shop-product-description\">\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (roleMatch) result.role = stripHtml(roleMatch[1]);

  // Bio - look for presentation section
  const bioSection = extractCleanHtml(
    html,
    /###?\s*Présentation|<h[23][^>]*>\s*Présentation/i,
    /<h[23]|###?\s*Extrait|###?\s*Contacter|<div class=\"woocommerce\"/i
  );
  if (bioSection) {
    // Keep paragraphs
    result.biography = bioSection
      .replace(/<\/?(?:div|section|article|span)[^>]*>/gi, "")
      .replace(/<(?!\\/?(p|strong|em|ul|li|br|a)\b)[^>]+>/gi, "")
      .trim();
  }

  // Conferences
  const confSection = extractCleanHtml(
    html,
    /Les conférences de|<h[23][^>]*>\s*Les conférences/i,
    /###?\s*Présentation|<h[23][^>]*>\s*Présentation/i
  );
  if (confSection) {
    const confItems = confSection.match(/<li>([\s\S]*?)<\/li>/gi);
    if (confItems) {
      result.conferences = confItems.map((li: string) => stripHtml(li)).filter((t: string) => t.length > 3);
    }
  }

  // Themes from categories
  const catMatches = html.match(/product_cat-([a-z0-9-]+)/gi);
  if (catMatches) {
    result.themes = [...new Set(catMatches.map((c: string) =>
      c.replace("product_cat-", "").replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
    ))];
  }

  // Video
  const videoMatch = html.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (videoMatch) result.video_url = `https://www.youtube.com/watch?v=${videoMatch[1]}`;

  // Languages
  const langSection = html.match(/Langues parlées[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (langSection) {
    const langs = langSection[1].match(/<li>([\s\S]*?)<\/li>/gi);
    if (langs) result.languages = langs.map((l: string) => stripHtml(l));
  }

  return result;
}

// ── WECHAMP ──
function parseWechamp(html: string, name: string) {
  const result: any = { source: "wechamp-entreprise.co", found: false };

  if (html.includes("error404") || html.includes("La page que vous cherchez")) return result;
  result.found = true;

  // Photo from OG or hero
  const ogImage = html.match(/<meta property=\"og:image\"[^>]+content=\"([^\"]+)\"/i);
  if (ogImage) result.photo_url = ogImage[1];

  // Photo from background in hero
  const heroPhoto = html.match(/class=\"hero[^\"]*\"[^>]*>\s*[\s\S]*?<img[^>]+src=\"([^\"]+)\"/i) ||
    html.match(/background:\s*url\('([^']+)'\)/i);
  if (heroPhoto && !result.photo_url) result.photo_url = heroPhoto[1];

  // Role from subtitle
  const subtitleMatch = html.match(/<p class=\"subtitle\">([\s\S]*?)<\/p>/i) ||
    html.match(/<div class=\"speaker-intro\">\s*<p>([\s\S]*?)<\/p>/i);
  if (subtitleMatch) result.role = stripHtml(subtitleMatch[1]);

  // Biography
  const bioMatch = extractCleanHtml(
    html,
    /class=\"editor[^\"]*biography|class=\"speaker-bio|<h[23][^>]*>\s*(?:Biographie|Sa biographie|À propos)/i,
    /<h[23]|class=\"speaker-conferences|class=\"speaker-themes/i
  );
  if (bioMatch) {
    result.biography = bioMatch
      .replace(/<\/?(?:div|section|article|span)[^>]*>/gi, "")
      .replace(/<(?!\\/?(p|strong|em|ul|li|br)\b)[^>]+>/gi, "")
      .trim();
  }

  // Conferences from list items
  const confMatches = html.match(/<h[34][^>]*class=\"[^\"]*conference[^\"]*\"[^>]*>([\s\S]*?)<\/h[34]>/gi);
  if (confMatches) {
    result.conferences = confMatches.map((c: string) => stripHtml(c));
  }

  // Themes
  const themeMatches = html.match(/<span class=\"[^\"]*theme[^\"]*\"[^>]*>([\s\S]*?)<\/span>/gi) ||
    html.match(/<a[^>]+class=\"[^\"]*tag[^\"]*\"[^>]*>([\s\S]*?)<\/a>/gi);
  if (themeMatches) {
    result.themes = themeMatches.map((t: string) => stripHtml(t));
  }

  return result;
}

// ── SIMONE ET NELSON ──
function parseSimoneNelson(html: string, name: string) {
  const result: any = { source: "simoneetnelson.com", found: false };

  if (html.includes("Page non trouvée") || (!html.includes("conferencier") && !html.includes("speaker"))) return result;
  result.found = true;

  // Photo
  const photoMatch = html.match(/data-src=\"(https:\/\/simoneetnelson\.com\/wp-content\/uploads\/[^\"]+)\"/i) ||
    html.match(/<img[^>]+src=\"(https:\/\/simoneetnelson\.com\/wp-content\/uploads\/[^\"]+)\"/i);
  if (photoMatch) result.photo_url = photoMatch[1];

  // OG image
  const ogImage = html.match(/<meta property=\"og:image\"[^>]+content=\"([^\"]+)\"/i);
  if (ogImage && !result.photo_url) result.photo_url = ogImage[1];

  // Role
  const roleMatch = html.match(/class=\"elementor-flip-box__layer__description\">\s*([\s\S]*?)\s*<\/div>/i);
  if (roleMatch) result.role = stripHtml(roleMatch[1]);

  // Biography
  const bioMatch = extractCleanHtml(
    html,
    /class=\"[^\"]*biography|class=\"[^\"]*biographie|<h[23][^>]*>\s*(?:Biographie|Présentation)/i,
    /<h[23]|class=\"[^\"]*conference|class=\"[^\"]*theme|<footer/i
  );
  if (bioMatch) {
    result.biography = bioMatch
      .replace(/<\/?(?:div|section|article|span)[^>]*>/gi, "")
      .replace(/<(?!\\/?(p|strong|em|ul|li|br)\b)[^>]+>/gi, "")
      .trim();
  }

  // Themes from taxonomy links
  const themeLinks = html.match(/theme-dintervention[^\"]*\"[^>]*>([\s\S]*?)<\/a>/gi);
  if (themeLinks) {
    result.themes = themeLinks.map((t: string) => stripHtml(t));
  }

  return result;
}

async function synthesizeWithAI(name: string, sources: any[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not found, returning raw data");
    return null;
  }

  const sourcesText = sources
    .filter((s) => s.found)
    .map((s) => {
      let text = `
=== Source: ${s.source} ===
`;
      if (s.role) text += `Rôle: ${s.role}\n`;
      if (s.biography) text += `Biographie: ${stripHtml(s.biography).substring(0, 3000)}\n`;
      if (s.conferences) text += `Conférences: ${s.conferences.join(", ")}\n`;
      if (s.themes) text += `Thèmes: ${s.themes.join(", ")}\n`;
      if (s.languages) text += `Langues: ${s.languages.join(", ")}\n`;
      return text;
    })
    .join("\n");

  const prompt = `Tu es un expert en création de fiches de conférenciers professionnels.

À partir des informations trouvées sur les sites concurrents pour "${name}", crée une fiche complète et professionnelle.

Données sources :
${sourcesText}

Génère un JSON avec cette structure exacte :
{
  "name": "Prénom Nom (correctement capitalisé)",
  "role": "Titre professionnel concis (ex: Champion Olympique et Entrepreneur)",
  "specialty": "Spécialité courte pour la carte (max 8 mots, ex: Triple Champion Olympique de Canoë)",
  "biography": "Biographie riche en HTML avec <p>, <strong> pour les mots-clés importants (chiffres, titres, prix). 3-5 paragraphes. Ne commence PAS par le nom du speaker. Style professionnel et engageant.",
  "themes": ["Thème 1", "Thème 2", "Thème 3"],
  "conferences": [
    {"title": "Titre de la conférence 1", "description": "Description HTML riche avec <p>, <strong>, <ul><li> si pertinent"},
    {"title": "Titre de la conférence 2", "description": "Description HTML"}
  ],
  "languages": ["Français", "Anglais"],
  "gender": "male" ou "female",
  "key_points": ["Point fort 1", "Point fort 2", "Point fort 3"]
}

IMPORTANT :
- La biographie doit être originale, pas un copier-coller
- Met en <strong> les chiffres clés, titres, prix, récompenses
- Les conférences doivent avoir des titres accrocheurs et des descriptions détaillées
- Si les données sont insuffisantes, enrichis avec des informations plausibles basées sur le contexte
- Réponds UNIQUEMENT avec le JSON, sans markdown ni commentaire`;

  try {
    const resp = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      console.error("AI API error:", resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (err) {
    console.error("AI synthesis error:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    if (!name || name.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Nom requis (min 2 caractères)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slug = slugify(name.trim());
    console.log(`Searching for "${name}" (slug: ${slug})`);

    // Check if speaker already exists in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await supabase
      .from("speakers")
      .select("id, name, slug")
      .or(`slug.eq.${slug},name.ilike.%${name.trim()}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Ce conférencier existe déjà dans la base : ${existing[0].name}`,
          existing: existing[0],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from all 3 competitor sites in parallel
    const urls = {
      orators: `https://orators.fr/les-intervenants/${slug}/`,
      wechamp: `https://www.wechamp-entreprise.co/conferencier/${slug}/`,
      simone: `https://simoneetnelson.com/annuaire/conferenciers/${slug}/`,
    };

    console.log("Fetching URLs:", urls);

    const [oratorsHtml, wechampHtml, simoneHtml] = await Promise.all([
      fetchPage(urls.orators),
      fetchPage(urls.wechamp),
      fetchPage(urls.simone),
    ]);

    const sources = [
      oratorsHtml ? parseOrators(oratorsHtml, name) : { source: "orators.fr", found: false },
      wechampHtml ? parseWechamp(wechampHtml, name) : { source: "wechamp-entreprise.co", found: false },
      simoneHtml ? parseSimoneNelson(simoneHtml, name) : { source: "simoneetnelson.com", found: false },
    ];

    const foundSources = sources.filter((s) => s.found);
    console.log(`Found on ${foundSources.length} source(s):`, foundSources.map((s) => s.source));

    if (foundSources.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Ce profil n'existe pas chez les concurrents.",
          sources: sources.map((s) => ({ source: s.source, found: false })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect best photo from sources
    const bestPhoto = foundSources.find((s) => s.photo_url)?.photo_url || null;

    // Use AI to synthesize the best profile
    const aiProfile = await synthesizeWithAI(name, sources);

    // Build the final profile
    const profile = {
      name: aiProfile?.name || name.trim(),
      slug,
      role: aiProfile?.role || foundSources.find((s) => s.role)?.role || null,
      specialty: aiProfile?.specialty || null,
      biography: aiProfile?.biography || foundSources.find((s) => s.biography)?.biography || null,
      themes: aiProfile?.themes || foundSources.flatMap((s) => s.themes || []).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
      conferences: aiProfile?.conferences || foundSources.flatMap((s) => (s.conferences || []).map((c: string) => ({ title: c, description: "" }))),
      languages: aiProfile?.languages || foundSources.find((s) => s.languages)?.languages || ["Français"],
      gender: aiProfile?.gender || "male",
      key_points: aiProfile?.key_points || [],
      photo_url: bestPhoto,
      video_url: foundSources.find((s) => s.video_url)?.video_url || null,
      sources: sources.map((s) => ({
        source: s.source,
        found: s.found,
        photo_url: s.photo_url || null,
      })),
    };

    return new Response(
      JSON.stringify({ success: true, profile }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
