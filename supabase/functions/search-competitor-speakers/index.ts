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

  // Themes - only extract from actual theme links in the speaker section, not nav
  const speakerThemeSection = html.match(/Thèmes de conférence[\s\S]*?(?:Formats|Biographie|id="biographie")/i);
  if (speakerThemeSection) {
    const themeLinks = speakerThemeSection[0].match(/\/theme\/([^/"]+)/gi);
    if (themeLinks) {
      r.themes = [...new Set(themeLinks.map((t: string) => {
        const name = t.replace(/\/theme\//i, "").replace(/\//g, "").replace(/-/g, " ");
        return name.charAt(0).toUpperCase() + name.slice(1);
      }))];
    }
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

  // Location
  const locMatch = html.match(/Localisation[\s\S]{0,500}?elementor-icon-list-text[^>]*>([^<]+)</i);
  if (locMatch?.[1]) {
    r.city = locMatch[1].trim().split(",")[0].trim();
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

  // Collect all available images (excluding profile photos) for conference illustrations
  const allImages: string[] = [];
  foundSources.forEach((s) => {
    if (s.images?.length) {
      // Filter out profile photos and tiny images
      const conferenceImages = s.images.filter((img: string) => 
        !img.includes("logo") && !img.includes("icon") && !img.includes("portrait") &&
        img !== s.photo_url
      );
      allImages.push(...conferenceImages);
    }
  });
  const uniqueImages = [...new Set(allImages)].slice(0, 6); // Max 6 images

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

  const prompt = `Tu es un rédacteur expert en fiches de conférenciers professionnels pour l'agence "Les Conférenciers" (lesconferenciers.com).
L'objectif est de transformer le parcours de l'intervenant en un récit captivant mais rigoureusement factuel.

DONNÉES BRUTES trouvées pour "${name}" :
${sourcesText}

CRÉE UNE FICHE COMPLÈTE en JSON.

═══════════════════════════════════════════
STRUCTURE BIOGRAPHIE OBLIGATOIRE (500-700 mots) :
═══════════════════════════════════════════

1. L'AMORCE (Accroche) : Une phrase forte qui résume la singularité. NE commence JAMAIS par le prénom ou le nom. Ex: "Figure incontournable de...", "Ancien champion...", "Titulaire d'un..."

2. LE PARCOURS (Factuel) : Les étapes clés, réalisations majeures et expertise technique.
   - Dates précises, chiffres vérifiables, noms d'institutions
   - Progression chronologique avec CONTEXTE narratif
   - Chaque paragraphe RACONTE une histoire (pas une liste sèche de postes)

3. LA VISION (Narratif) : Pourquoi il/elle fait ce qu'il/elle fait. Ce que le public ressent et apprend après l'avoir écouté(e).

4. SIGNATURE : Conclusion brève sur l'impact humain + mention naturelle de son activité de conférencier/ère.

STYLE ET TON :
- Mélange d'objectivité journalistique (style Wikipédia pour les faits) et narration immersive (storytelling sur la mission/vision)
- Accent sur l'authenticité comme levier de performance et d'impact
- Éviter le jargon marketing creux, privilégier les résultats concrets
- Verbes d'action puissants, paragraphes aérés
- Rédaction à la 3e personne (Il/Elle)

FORMATAGE HTML :
- 5 à 7 paragraphes <p>...</p> séparés, chacun 2-3 phrases max
- <strong> sur : dates, chiffres clés, titres/prix, institutions, mots-clés importants
- <ul><li> pour les énumérations (palmarès, domaines d'expertise, ouvrages)
- AUCUN markdown (** ou *) — HTML exclusivement
- Chaque paragraphe sur une NOUVELLE LIGNE

MAUVAIS EXEMPLE : "Ancienne journaliste et présentatrice sportive." → trop sec
BON EXEMPLE : "Après <strong>10 ans</strong> comme journaliste sportive sur <strong>Canal+</strong> et <strong>France Télévisions</strong>, elle a couvert <strong>3 Coupes du Monde</strong> et interviewé les plus grands athlètes français." → riche et factuel

⚠️ RÈGLE ANTI-PLAGIAT ⚠️
- REFORMULER INTÉGRALEMENT — AUCUNE phrase ne doit ressembler aux sources
- CROISER les informations de TOUTES les sources pour vérifier les faits
- Changer ORDRE, VERBES, ADJECTIFS, STRUCTURE des phrases
- Ajouter CONTEXTE et TRANSITIONS narratives absents des sources
- Ne JAMAIS mentionner : Orators, WeChamp, We Champ, Simone et Nelson, simoneetnelson, wechamp-entreprise, Wikipedia, Gala, Evene

CONTENU FACTUEL OBLIGATOIRE :
- Dates précises, chiffres vérifiables, noms d'institutions/entreprises/compétitions
- Titres exacts (diplômes, postes, palmarès)
- Anecdotes ou faits marquants qui rendent le parcours vivant

═══════════════════════════════════════════
AUTRES CHAMPS :
═══════════════════════════════════════════

RÈGLES SEO :
- seo_title : "${name} — Conférencier [thème principal] | Les Conférenciers" (max 60 car., adapter Conférencier/Conférencière selon le genre)
- meta_description : 1 phrase fluide 140-155 car. avec "conférence" ou "conférencier/ère" + le nom

CONFÉRENCES :
- 1 à 3 conférences thématiques, titre accrocheur
- Description HTML 3-4 paragraphes <p> avec <strong>, SANS images, SANS markdown
- REFORMULATION OBLIGATOIRE, 100% originale

KEY_POINTS : 3-5 points forts factuels et percutants

WHY_EXPERTISE : phrase UNIQUE et SPÉCIFIQUE sur l'expertise (domaines précis, réalisations concrètes, PAS générique)
WHY_IMPACT : phrase UNIQUE et SPÉCIFIQUE sur l'impact concret des interventions

JSON ATTENDU :
{
  "name": "Prénom Nom",
  "role": "Titre professionnel court",
  "specialty": "Phrase d'accroche courte (max 8 mots)",
  "biography": "HTML riche — MINIMUM 5 paragraphes, 500-700 mots",
  "themes": ["Thème 1", "Thème 2", "Thème 3"],
  "conferences": [{"title": "Titre", "description": "HTML riche"}],
  "languages": ["Français"],
  "gender": "male ou female",
  "key_points": ["Point fort 1", "Point fort 2"],
  "why_expertise": "Phrase personnalisée",
  "why_impact": "Phrase personnalisée",
  "seo_title": "Titre SEO (max 60 car.)",
  "meta_description": "Meta description (140-155 car.)"
}

IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans commentaire ni backtick.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    let { name, enrich } = await req.json();
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({ success: false, error: "Nom requis (min 2 caractères)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slug = slugify(name.trim());
    console.log(`Searching "${name}" → slug: ${slug}${enrich ? " (enrich mode)" : ""}`);

    // Check if speaker already exists (skip in enrich mode)
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!enrich) {
      const { data: existing } = await supabase.from("speakers").select("id, name, slug, archived").or(`slug.eq.${slug},name.ilike.${name.trim()}`).limit(1);
      if (existing && existing.length > 0) {
        // If the existing speaker is online (not archived), block import
        if (!existing[0].archived) {
          return new Response(JSON.stringify({ success: false, error: `Ce conférencier existe déjà (en ligne) : ${existing[0].name}`, existing: existing[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // If archived, allow re-import by switching to enrich mode
        console.log(`Speaker "${existing[0].name}" exists but is archived — will update instead of blocking`);
        enrich = true;
      }
    }

    // Fetch all 3 competitor sources in parallel
    console.log("Fetching competitor sources...");
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
    console.log(`Found on ${found.length} competitor source(s): ${found.map(s => s.source).join(", ")}`);
    
    // Log what data was extracted
    found.forEach(s => {
      console.log(`  ${s.source}: bio=${(s.biography || "").length}c, role="${s.role || ""}", themes=${(s.themes || []).length}, faits=${(s.faits || []).length}`);
    });

    // ── ALWAYS fetch Wikipedia/Gala/Evene as supplementary factual sources ──
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supplementarySources: any[] = [];
    
    if (firecrawlKey) {
      console.log("Fetching supplementary factual sources (Wikipedia, Gala, Evene)...");
      const fallbackUrls = [
        { url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(name.trim().replace(/ /g, "_"))}`, name: "Wikipedia" },
        { url: `https://evene.lefigaro.fr/celebre/biographie/${slug}.php`, name: "Evene/Le Figaro" },
        { url: `https://www.gala.fr/stars_et_gotha/${slug}`, name: "Gala.fr" },
      ];

      const fbPromises = fallbackUrls.map(async ({ url, name: srcName }) => {
        try {
          const fbResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
          });
          const fbData = await fbResp.json();
          const md = fbData?.data?.markdown || fbData?.markdown || "";
          
          if (md.length > 200 && !md.includes("page n'existe pas") && !md.includes("404") && !md.includes("Aucun résultat") && !md.includes("n'existe pas encore")) {
            console.log(`  ✓ ${srcName}: ${md.length} chars`);
            return { source: srcName, found: true, biography: md.substring(0, 8000) };
          } else {
            console.log(`  ✗ ${srcName}: not found or too short`);
            return { source: srcName, found: false };
          }
        } catch {
          console.log(`  ✗ ${srcName}: error`);
          return { source: srcName, found: false };
        }
      });

      const fbResults = await Promise.all(fbPromises);
      supplementarySources.push(...fbResults.filter(f => f.found));
    }

    // Combine all sources for AI synthesis
    const allSources = [...sources, ...supplementarySources];
    const allFound = allSources.filter((s) => s.found);

    if (allFound.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Ce profil n'existe ni chez les concurrents, ni sur Wikipedia, Gala ou Evene.",
        sources: allSources.map((s) => ({ source: s.source, found: false, photo_url: null })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get the best photo URL
    const bestPhoto = found.find((s) => s.photo_url)?.photo_url || null;

    // Get video URL
    const videoUrl = found.find((s) => s.videos?.length)?.videos?.[0] || null;

    // Synthesize with AI using ALL sources (competitors + factual)
    console.log(`Synthesizing with AI from ${allFound.length} sources...`);
    const aiProfile = await synthesizeWithAI(name, allFound);
    
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
      why_expertise: aiProfile?.why_expertise || null,
      why_impact: aiProfile?.why_impact || null,
      seo_title: aiProfile?.seo_title || null,
      meta_description: aiProfile?.meta_description || null,
      photo_url: bestPhoto,
      video_url: videoUrl,
      city: found.find((s) => s.city)?.city || null,
      offline: found.length === 0, // Flag offline if only from fallback sources
      sources: allSources.map((s) => ({ source: s.source, found: s.found, photo_url: s.photo_url || null })),
    };

    return new Response(JSON.stringify({ success: true, profile }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
