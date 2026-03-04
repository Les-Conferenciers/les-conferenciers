import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

// Extract bio HTML with <strong> tags from lesconferenciers.com
function extractBioFromOldSite(html: string): string | null {
  // Find <div class="bio-text"> content
  const bioMatch = html.match(/<div class="bio-text">([\s\S]*?)<\/div>/i);
  if (!bioMatch) return null;
  
  let bio = bioMatch[1].trim();
  
  // Clean up: remove commented-out sections
  bio = bio.replace(/<!--[\s\S]*?-->/g, "");
  
  // Remove any image tags within the bio
  bio = bio.replace(/<img[^>]*>/gi, "");
  
  // Clean up empty paragraphs
  bio = bio.replace(/<p>\s*<\/p>/gi, "");
  
  // Clean &nbsp;
  bio = bio.replace(/&nbsp;/g, " ");
  
  // Trim each line
  bio = bio.split("\n").map(l => l.trim()).filter(l => l.length > 0).join("\n");
  
  if (bio.length < 50) return null;
  return bio;
}

// Extract conference titles and descriptions from competitor pages
function extractConferencesFromHtml(html: string): { title: string; description: string }[] {
  const conferences: { title: string; description: string }[] = [];
  
  // Pattern 1: h3/h4 followed by content (common across sites)
  const headingBlocks = [...html.matchAll(/<h[34][^>]*>([\s\S]*?)<\/h[34]>\s*([\s\S]*?)(?=<h[34]|<\/section|<\/article|<footer|$)/gi)];
  for (const m of headingBlocks) {
    const title = m[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    let desc = m[2].replace(/<img[^>]*>/gi, "").replace(/<!--[\s\S]*?-->/g, "").trim();
    // Only keep if looks like a conference title
    if (title.length > 8 && title.length < 250 && desc.length > 30 && !/menu|nav|footer|header|cookie/i.test(title)) {
      conferences.push({ title, description: desc });
    }
  }

  // Pattern 2: conference cards/items with specific class names
  const cardBlocks = [...html.matchAll(/class="[^"]*(?:conference|intervention|keynote|talk)[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*(?:conference|intervention|keynote|talk)|<\/section|$)/gi)];
  for (const m of cardBlocks) {
    const titleMatch = m[1].match(/<h[2345][^>]*>(.*?)<\/h[2345]>/i);
    // Get all <p> text as description
    const pTags = [...m[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    if (titleMatch) {
      const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
      const desc = pTags.map(p => p[1].trim()).filter(p => p.length > 10).join("\n\n");
      if (title.length > 5 && desc.length > 20) {
        conferences.push({ title, description: desc });
      }
    }
  }

  return conferences;
}

// Extract video URLs from any HTML page
function extractVideos(html: string): string[] {
  const vids: string[] = [];
  const re = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    vids.push(`https://www.youtube.com/embed/${m[1]}`);
  }
  return [...new Set(vids)];
}

// Extract languages from competitor pages
function extractLanguages(html: string): string[] | null {
  // Orators pattern
  const langSec = html.match(/Langues?\s*(?:parlées?|d['']intervention)?[\s\S]{0,500}?<ul>([\s\S]*?)<\/ul>/i);
  if (langSec) {
    const ls = langSec[1].match(/<li[^>]*>([^<]+)<\/li>/gi);
    if (ls) {
      return ls.map(l => l.replace(/<[^>]+>/g, "").trim()).filter(l => l.length > 1);
    }
  }
  
  // Check for flag images as language indicators
  const flags: string[] = [];
  if (html.includes("france.png") || html.includes("🇫🇷") || html.includes("drapeau-france")) flags.push("Français");
  if (html.includes("english.png") || html.includes("🇬🇧") || html.includes("drapeau-anglais") || html.includes("united-kingdom")) flags.push("Anglais");
  if (html.includes("espanol") || html.includes("spain") || html.includes("🇪🇸")) flags.push("Espagnol");
  
  return flags.length > 0 ? flags : null;
}

// Extract city/location from competitor pages
function extractCity(html: string): string | null {
  // Orators pattern
  const locMatch = html.match(/Localisation[\s\S]{0,500}?elementor-icon-list-text[^>]*>([^<]+)</i);
  if (locMatch?.[1]) return locMatch[1].trim().split(",")[0].trim();
  
  // WeChamp pattern
  const wechampLoc = html.match(/Lieu\s*:\s*([^<\n]+)/i);
  if (wechampLoc?.[1]) return wechampLoc[1].trim();
  
  // Simone et Nelson pattern
  const simoneLoc = html.match(/Basé[e]?\s+(?:à|en|au)\s+([^<,.\n]+)/i);
  if (simoneLoc?.[1]) return simoneLoc[1].trim();
  
  return null;
}

// Use AI to add bold formatting to existing bios
async function addBoldFormatting(name: string, biography: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;
  
  const prompt = `Tu es un expert en mise en forme HTML de biographies de conférenciers.

BIOGRAPHIE ACTUELLE de "${name}" :
${biography}

OBJECTIF : Ajouter des balises <strong> sur les éléments importants SANS changer le texte ni la structure. Tu dois conserver exactement les mêmes paragraphes <p>, les mêmes listes <ul><li>, le même contenu textuel.

ÉLÉMENTS À METTRE EN GRAS (<strong>) :
- Les dates et années (ex: "en <strong>2011</strong>")
- Les chiffres clés (ex: "<strong>15 000 collaborateurs</strong>", "<strong>deux titres olympiques</strong>")
- Les titres, prix et distinctions (ex: "<strong>champion du monde</strong>", "<strong>Légion d'Honneur</strong>")
- Les diplômes et certifications (ex: "<strong>DESS en Stratégie</strong>")
- Les institutions et organisations importantes (ex: "<strong>CAC 40</strong>", "<strong>CNRS</strong>")
- Le nom complet du conférencier quand il apparaît (ex: "<strong>Claudie Haigneré</strong>")
- Les concepts clés et méthodes (ex: "<strong>la Magie de la Vente®</strong>")

NE PAS mettre en gras :
- Les prépositions, articles, conjonctions
- Des phrases entières (seulement des groupes de mots précis)
- Les mots génériques comme "conférencier", "entreprise" sauf s'ils font partie d'un nom propre

EXEMPLE DE BON RÉSULTAT :
<p><strong>Claudie Haigneré</strong> est docteur en médecine et possède des certificats d'études spécialisées en <strong>rhumatologie</strong>. Elle a obtenu un <strong>doctorat en Sciences</strong> au Laboratoire <strong>LPA CNRS</strong> de <strong>1987</strong> à <strong>1992</strong>.</p>

Réponds UNIQUEMENT avec le HTML formaté, sans commentaire ni backtick.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Clean up potential markdown wrapping
    const cleaned = content.replace(/```html\s*/g, "").replace(/```\s*/g, "").trim();
    if (cleaned.includes("<p>") && cleaned.length > 50) return cleaned;
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json().catch(() => ({}));
  const batchSize = body.batch_size || 5;
  const offset = body.offset || 0;
  const mode = body.mode || "all"; // "bold_only", "enrich_only", "all"

  // Get speakers to process
  const { data: speakers, error } = await supabase
    .from("speakers")
    .select("id, name, slug, biography, video_url, languages, city")
    .eq("archived", false)
    .order("name")
    .range(offset, offset + batchSize - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!speakers || speakers.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Aucun speaker à traiter", 
      processed: 0,
      done: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const speaker of speakers) {
    const result: any = { name: speaker.name, slug: speaker.slug, updates: {} };
    const updates: any = {};

    // Freeze bios for speakers imported before 2026-03-05 (existing batch)
    const isExistingSpeaker = new Date(speaker.created_at) < new Date("2026-03-05T00:00:00Z");

    try {
      // ── STEP 1: Bio formatting (only for NEW speakers) ──
      if (!isExistingSpeaker && (mode === "all" || mode === "bold_only")) {
        const slugVariants = [speaker.slug];
        if (speaker.slug.match(/-\d+$/)) {
          slugVariants.push(speaker.slug.replace(/-\d+$/, ""));
        }

        for (const sv of slugVariants) {
          const html = await fetchPage(`https://www.lesconferenciers.com/conferencier/${sv}/`);
          if (html && !html.includes("error404") && !html.includes("Aucun résultat")) {
            const oldSiteBio = extractBioFromOldSite(html);
            if (oldSiteBio) {
              updates.biography = oldSiteBio;
              result.bio_source = "lesconferenciers.com";
            }
            break;
          }
        }

        // AI bold formatting fallback for new speakers
        const bioNeedsBold = speaker.biography && speaker.biography.length > 50 && !/<strong>/i.test(speaker.biography);
        if (!updates.biography && bioNeedsBold) {
          const formatted = await addBoldFormatting(speaker.name, speaker.biography);
          if (formatted) {
            updates.biography = formatted;
            result.bio_source = "ai_bold_formatting";
          }
        }
      }

      // Still fetch old site for metadata (video, languages) for ALL speakers
      if (mode === "all" || mode === "enrich_only") {
        const slugVariants = [speaker.slug];
        if (speaker.slug.match(/-\d+$/)) {
          slugVariants.push(speaker.slug.replace(/-\d+$/, ""));
        }
        for (const sv of slugVariants) {
          const html = await fetchPage(`https://www.lesconferenciers.com/conferencier/${sv}/`);
          if (html && !html.includes("error404") && !html.includes("Aucun résultat")) {
            if (!speaker.languages || speaker.languages.length === 0) {
              const langs = extractLanguages(html);
              if (langs && langs.length > 0) updates.languages = langs;
            }
            if (!speaker.video_url) {
              const videos = extractVideos(html);
              if (videos.length > 0) updates.video_url = videos[0];
            }
            break;
          }
        }
      }

      // ── STEP 2: Enrich from competitor sites ──
      if (mode === "all" || mode === "enrich_only") {
        const slug = speaker.slug.replace(/-\d+$/, "");
        
        // Fetch existing conferences for this speaker
        const { data: existingConfs } = await supabase
          .from("speaker_conferences")
          .select("title")
          .eq("speaker_id", speaker.id);
        const existingTitles = (existingConfs || []).map(c => c.title.toLowerCase().trim());
        
        // Fetch competitor pages in parallel
        const [oratorsHtml, wechampHtml, simoneHtml] = await Promise.all([
          fetchPage(`https://orators.fr/les-intervenants/${slug}/`),
          fetchPage(`https://www.wechamp-entreprise.co/conferencier/${slug}/`),
          fetchPage(`https://simoneetnelson.com/annuaire/conferenciers/${slug}/`),
        ]);

        const competitorPages = [
          { name: "orators", html: oratorsHtml },
          { name: "wechamp", html: wechampHtml },
          { name: "simone", html: simoneHtml },
        ].filter(p => p.html && p.html.length > 2000 && !p.html.includes("error404") && !p.html.includes("Page non trouvée"));

        result.competitors_found = competitorPages.map(p => p.name);
        let conferencesAdded = 0;

        for (const page of competitorPages) {
          // Video
          if (!speaker.video_url && !updates.video_url) {
            const videos = extractVideos(page.html!);
            if (videos.length > 0) {
              updates.video_url = videos[0];
              result.video_source = page.name;
            }
          }

          // Languages
          if ((!speaker.languages || speaker.languages.length === 0) && !updates.languages) {
            const langs = extractLanguages(page.html!);
            if (langs && langs.length > 0) {
              updates.languages = langs;
              result.languages_source = page.name;
            }
          }

          // City
          if (!speaker.city && !updates.city) {
            const city = extractCity(page.html!);
            if (city) {
              updates.city = city;
              result.city_source = page.name;
            }
          }

          // Conferences - add new ones that don't already exist
          const newConfs = extractConferencesFromHtml(page.html!);
          for (const conf of newConfs) {
            const titleLower = conf.title.toLowerCase().trim();
            // Skip if a similar title already exists
            if (existingTitles.some(t => t === titleLower || t.includes(titleLower) || titleLower.includes(t))) continue;
            // Skip generic/nav titles
            if (/à propos|contact|accueil|biograph|témoignage|avis|profil/i.test(conf.title)) continue;
            
            const { error: insertErr } = await supabase
              .from("speaker_conferences")
              .insert({
                speaker_id: speaker.id,
                title: conf.title,
                description: conf.description,
                display_order: existingTitles.length + conferencesAdded,
              });
            if (!insertErr) {
              conferencesAdded++;
              existingTitles.push(titleLower);
            }
          }
          if (conferencesAdded > 0) {
            result.conferences_added = conferencesAdded;
            result.conferences_source = page.name;
          }
        }
      }

      // ── STEP 3: Apply updates ──
      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from("speakers")
          .update(updates)
          .eq("id", speaker.id);

        if (updateErr) {
          result.error = updateErr.message;
        } else {
          result.updates = Object.keys(updates);
          result.success = true;
        }
      } else {
        result.success = true;
        result.updates = [];
        result.message = "Rien à mettre à jour";
      }
    } catch (err) {
      result.error = err.message;
    }

    results.push(result);
  }

  // Count total speakers for progress
  const { count } = await supabase
    .from("speakers")
    .select("id", { count: "exact", head: true })
    .eq("archived", false);

  return new Response(
    JSON.stringify({
      success: true,
      processed: results.length,
      offset,
      total: count,
      next_offset: offset + batchSize,
      done: offset + batchSize >= (count || 0),
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
