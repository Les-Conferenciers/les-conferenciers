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

// Extract bio image URL from lesconferenciers.com
function extractBioImage(html: string): string | null {
  const match = html.match(/<div class="bio-image">\s*<img[^>]*(?:data-src|src)="([^"]+)"/i);
  if (match?.[1] && match[1].startsWith("http")) return match[1];
  return null;
}

// Extract reviews from "Ce qu'ils en pensent" tab on lesconferenciers.com
function extractReviews(html: string): { comment: string; author_name: string; author_title: string }[] {
  const reviews: { comment: string; author_name: string; author_title: string }[] = [];
  
  // Find tab 3 content (Ce qu'ils en pensent)
  const tab3Match = html.match(/<div class="et_pb_tab et_pb_tab_3[^"]*"[^>]*>([\s\S]*?)(?:<\/div>\s*<div class="et_pb_tab|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/i);
  if (!tab3Match) return reviews;
  
  const tabContent = tab3Match[1];
  
  // Extract review blocks: typically «...» followed by author name and title
  // Pattern: « comment text » \n Author Name \n Author Title
  const reviewBlocks = tabContent.match(/«\s*([\s\S]*?)\s*»/g);
  if (!reviewBlocks) return reviews;
  
  // Get the full text content, strip HTML tags
  const plainText = tabContent.replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/\n{2,}/g, "\n").trim();
  
  // Split by « to find each review block
  const parts = plainText.split(/«/).filter(p => p.includes("»"));
  
  for (const part of parts) {
    const [commentPart, afterQuote] = part.split("»");
    if (!commentPart || commentPart.trim().length < 10) continue;
    
    const comment = commentPart.trim();
    
    // After the closing » we expect author info on next lines
    const lines = (afterQuote || "").split("\n").map(l => l.trim()).filter(l => l.length > 1);
    
    let authorName = "";
    let authorTitle = "";
    
    if (lines.length >= 2) {
      authorName = lines[0];
      authorTitle = lines.slice(1).join(", ");
    } else if (lines.length === 1) {
      authorName = lines[0];
    }
    
    // Clean up author name (remove leading/trailing special chars)
    authorName = authorName.replace(/^[\s\-–—:,]+|[\s\-–—:,]+$/g, "").trim();
    authorTitle = authorTitle.replace(/^[\s\-–—:,]+|[\s\-–—:,]+$/g, "").trim();
    
    if (comment.length > 10 && authorName.length > 2) {
      reviews.push({ comment, author_name: authorName, author_title: authorTitle });
    }
  }
  
  return reviews;
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
    .select("id, name, slug, biography, video_url, languages, city, created_at")
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

      // Still fetch old site for metadata (video, languages, bio image, reviews) for ALL speakers
      if (mode === "all" || mode === "enrich_only") {
        const slugVariants = [speaker.slug];
        if (speaker.slug.match(/-\d+$/)) {
          slugVariants.push(speaker.slug.replace(/-\d+$/, ""));
        }
        let oldSiteHtml: string | null = null;
        for (const sv of slugVariants) {
          const html = await fetchPage(`https://www.lesconferenciers.com/conferencier/${sv}/`);
          if (html && !html.includes("error404") && !html.includes("Aucun résultat")) {
            oldSiteHtml = html;
            if (!speaker.languages || speaker.languages.length === 0) {
              const langs = extractLanguages(html);
              if (langs && langs.length > 0) updates.languages = langs;
            }
            if (!speaker.video_url) {
              const videos = extractVideos(html);
              if (videos.length > 0) updates.video_url = videos[0];
            }
            
            // Extract bio image and inject into biography if not already present
            const bioImageUrl = extractBioImage(html);
            if (bioImageUrl && speaker.biography && !speaker.biography.includes("<img")) {
              // Insert image after the 2nd paragraph in the biography
              const paragraphs = speaker.biography.split("</p>");
              if (paragraphs.length >= 3) {
                const insertIdx = 2; // after 2nd </p>
                paragraphs.splice(insertIdx, 0, `<img src="${bioImageUrl}" alt="${speaker.name}" loading="lazy" />`);
                updates.biography = paragraphs.join("</p>");
                result.bio_image = bioImageUrl;
              } else if (paragraphs.length >= 2) {
                paragraphs.splice(1, 0, `<img src="${bioImageUrl}" alt="${speaker.name}" loading="lazy" />`);
                updates.biography = paragraphs.join("</p>");
                result.bio_image = bioImageUrl;
              }
            }
            
            // Extract reviews from "Ce qu'ils en pensent" tab
            const extractedReviews = extractReviews(html);
            if (extractedReviews.length > 0) {
              // Check existing reviews for this speaker
              const { data: existingReviews } = await supabase
                .from("reviews")
                .select("author_name")
                .eq("speaker_id", speaker.id);
              const existingAuthors = (existingReviews || []).map(r => r.author_name.toLowerCase().trim());
              
              let reviewsAdded = 0;
              for (const review of extractedReviews) {
                if (existingAuthors.includes(review.author_name.toLowerCase().trim())) continue;
                const { error: reviewErr } = await supabase
                  .from("reviews")
                  .insert({
                    speaker_id: speaker.id,
                    author_name: review.author_name,
                    author_title: review.author_title || null,
                    comment: review.comment,
                    rating: 5,
                  });
                if (!reviewErr) reviewsAdded++;
              }
              if (reviewsAdded > 0) {
                result.reviews_added = reviewsAdded;
              }
            }
            
            break;
          }
        }
      }

      // ── STEP 2: Enrich from competitor sites ──
      if (mode === "all" || mode === "enrich_only") {
        const slug = speaker.slug.replace(/-\d+$/, "");
        
        
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

          // Conference scraping DISABLED - was grabbing random HTML as conferences

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
