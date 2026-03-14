import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function decodeEntities(str: string): string {
  return str
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ucirc;/g, "û")
    .replace(/&icirc;/g, "î")
    .replace(/&acirc;/g, "â")
    .replace(/&ecirc;/g, "ê")
    .replace(/&uuml;/g, "ü")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…");
}

function getTabContent(html: string, tabIndex: number): string {
  // Split by tab divs
  const tabParts = html.split(/<div class="et_pb_tab et_pb_tab_/);
  if (tabIndex + 1 >= tabParts.length) return '';
  
  const tabSection = tabParts[tabIndex + 1]; // +1 because first split part is before any tab
  
  // Extract content between et_pb_tab_content tags
  const contentMatch = tabSection.match(/<div class="et_pb_tab_content">([\s\S]*?)(?:<\/div>\s*<\/div>)/);
  if (!contentMatch) return '';
  
  return decodeEntities(contentMatch[1].trim());
}

function extractBioFromHtml(html: string) {
  // Extract key points (pépites)
  const keyPoints: string[] = [];
  const pepiteRegex = /<li class="pepite">(.*?)<\/li>/gs;
  let match;
  while ((match = pepiteRegex.exec(html)) !== null) {
    const text = decodeEntities(match[1].replace(/<[^>]+>/g, '').trim());
    if (text) keyPoints.push(text);
  }

  // Extract languages from flags
  const languages: string[] = [];
  // Check the header area (before the tabs) for language flags
  const headerArea = html.split('et_pb_tabs')[0] || '';
  if (headerArea.includes('france') || headerArea.includes('la-france') || headerArea.includes('français')) {
    languages.push('Français');
  }
  if (headerArea.includes('english') || headerArea.includes('anglais')) {
    languages.push('Anglais');
  }
  if (headerArea.includes('espagnol') || headerArea.includes('spain') || headerArea.includes('espagne')) {
    languages.push('Espagnol');
  }
  if (headerArea.includes('allemand') || headerArea.includes('german') || headerArea.includes('allemagne')) {
    languages.push('Allemand');
  }
  if (languages.length === 0) languages.push('Français');

  // Extract biography from Tab 0
  let biography = getTabContent(html, 0);
  if (biography) {
    // Replace lazy-loaded images with real URLs
    biography = biography.replace(/<img[^>]*src="data:image[^"]*"[^>]*data-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, 
      '<img src="$1" alt="$2" class="float-right ml-6 mb-4 rounded-lg w-64 max-w-[40%]" />');
    // Remove remaining data: images
    biography = biography.replace(/<img[^>]*src="data:image[^"]*"[^>]*>/g, '');
    // Clean bio wrapper divs
    biography = biography.replace(/<div class="bio">/g, '');
    biography = biography.replace(/<div class="bio-text">/g, '');
    biography = biography.replace(/<div class="bio-image">[\s\S]*?<\/div>/g, '');
    biography = biography.replace(/<\/div>/g, '');
    // Clean classes
    biography = biography.replace(/\s*class="fiche"/g, '');
    biography = biography.replace(/\s*class="p\d+"/g, '');
    biography = biography.replace(/\s*class=""/g, '');
    biography = biography.replace(/\s*data-[a-z-]+="[^"]*"/g, '');
    biography = biography.replace(/\s*style="[^"]*"/g, '');
    biography = biography.trim();
  }

  // Extract conferences from Tab 1
  const conferences: { title: string; description: string }[] = [];
  const confContent = getTabContent(html, 1);
  if (confContent) {
    let cleanConf = confContent;
    // Remove lazy-loaded images
    cleanConf = cleanConf.replace(/<img[^>]*src="data:image[^"]*"[^>]*>/g, '');
    cleanConf = cleanConf.replace(/<img[^>]*>/g, '');
    // Clean data attributes and styles
    cleanConf = cleanConf.replace(/\s*data-[a-z-]+="[^"]*"/g, '');
    cleanConf = cleanConf.replace(/\s*class="[^"]*"/g, '');
    cleanConf = cleanConf.replace(/\s*style="[^"]*"/g, '');

    // Split by h2 or h4 headers
    const parts = cleanConf.split(/<h[24][^>]*>/);
    
    for (let i = 1; i < parts.length; i++) {
      const section = parts[i];
      const titleEndMatch = section.match(/<\/h[24]>/);
      if (!titleEndMatch) continue;
      
      const titleEndIdx = section.indexOf(titleEndMatch[0]);
      const title = decodeEntities(section.substring(0, titleEndIdx).replace(/<[^>]+>/g, '').trim());
      let description = section.substring(titleEndIdx + titleEndMatch[0].length).trim();
      
      if (title && description) {
        conferences.push({ title, description });
      }
    }

    // If no headers found but there's content, treat as single conference
    if (conferences.length === 0 && cleanConf.trim().length > 50) {
      // Check for a simple h4 title
      const h4Match = cleanConf.match(/<h4>(.*?)<\/h4>/);
      if (h4Match) {
        const title = decodeEntities(h4Match[1].replace(/<[^>]+>/g, '').trim());
        const description = cleanConf.replace(/<h4>.*?<\/h4>/, '').trim();
        if (description) conferences.push({ title, description });
      } else {
        conferences.push({ title: 'Conférence', description: cleanConf.trim() });
      }
    }
  }

  return { biography, keyPoints, languages, conferences };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slugs, dryRun = false, skipBio = false, skipConferences = false } = await req.json();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results: Record<string, any> = {};

    for (const slug of slugs) {
      try {
        const url = `https://www.lesconferenciers.com/conferencier/${slug}/`;
        console.log(`Scraping ${url}...`);
        
        const res = await fetch(url);
        if (!res.ok) {
          results[slug] = { error: `HTTP ${res.status}` };
          continue;
        }
        const html = await res.text();
        
        const extracted = extractBioFromHtml(html);
        
        if (dryRun) {
          results[slug] = {
            bioLength: extracted.biography.length,
            keyPoints: extracted.keyPoints,
            languages: extracted.languages,
            conferenceCount: extracted.conferences.length,
            conferenceTitles: extracted.conferences.map(c => c.title),
            bioPreview: extracted.biography.substring(0, 300),
            confPreview: extracted.conferences.map(c => ({ title: c.title, descPreview: c.description.substring(0, 150) })),
          };
          continue;
        }

        // Get speaker ID
        const { data: speaker } = await supabase
          .from('speakers')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!speaker) {
          results[slug] = { error: 'Speaker not found in DB' };
          continue;
        }

        const updateData: any = {};
        if (!skipBio && extracted.biography) updateData.biography = extracted.biography;
        if (extracted.keyPoints.length > 0) updateData.key_points = extracted.keyPoints;
        if (extracted.languages.length > 0) updateData.languages = extracted.languages;

        if (Object.keys(updateData).length > 0) {
          await supabase.from('speakers').update(updateData).eq('id', speaker.id);
        }

        if (!skipConferences && extracted.conferences.length > 0) {
          await supabase.from('speaker_conferences').delete().eq('speaker_id', speaker.id);
          
          for (let i = 0; i < extracted.conferences.length; i++) {
            await supabase.from('speaker_conferences').insert({
              speaker_id: speaker.id,
              title: extracted.conferences[i].title,
              description: extracted.conferences[i].description,
              display_order: i,
            });
          }
        }

        results[slug] = {
          success: true,
          bioUpdated: !skipBio && !!extracted.biography,
          keyPointsCount: extracted.keyPoints.length,
          languagesUpdated: extracted.languages,
          conferencesReplaced: skipConferences ? 0 : extracted.conferences.length,
        };
      } catch (err) {
        results[slug] = { error: err instanceof Error ? err.message : 'Unknown error' };
      }
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
