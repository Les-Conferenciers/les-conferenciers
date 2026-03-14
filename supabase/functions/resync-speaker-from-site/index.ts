import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractBioFromHtml(html: string): { biography: string; keyPoints: string[]; languages: string[]; conferences: { title: string; description: string }[] } {
  // Extract key points (pépites)
  const keyPoints: string[] = [];
  const pepiteRegex = /<li class="pepite">(.*?)<\/li>/gs;
  let match;
  while ((match = pepiteRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) keyPoints.push(text);
  }

  // Extract languages from flags
  const languages: string[] = [];
  if (html.includes('france') || html.includes('la-france') || html.includes('Parle français')) {
    languages.push('Français');
  }
  if (html.includes('english') || html.includes('anglais') || html.includes('Parle anglais')) {
    languages.push('Anglais');
  }
  if (html.includes('espagnol') || html.includes('spain') || html.includes('espagne')) {
    languages.push('Espagnol');
  }
  if (html.includes('allemand') || html.includes('german') || html.includes('allemagne')) {
    languages.push('Allemand');
  }
  if (languages.length === 0) languages.push('Français');

  // Extract biography from the first tab
  let biography = '';
  const bioTabMatch = html.match(/et_pb_tab_0.*?<div class="et_pb_tab_content">(.*?)<\/div>\s*<\/div>\s*<div class="et_pb_tab et_pb_tab_1/s);
  if (bioTabMatch) {
    biography = bioTabMatch[1];
    // Clean up the bio - remove lazy-loaded base64 images but keep real image URLs
    biography = biography.replace(/<img[^>]*src="data:image[^"]*"[^>]*data-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '<img src="$1" alt="$2" class="float-right ml-6 mb-4 rounded-lg w-64 max-w-[40%]" />');
    biography = biography.replace(/<img[^>]*src="data:image[^"]*"[^>]*>/g, '');
    // Remove div wrappers but keep content
    biography = biography.replace(/<div class="bio">/g, '');
    biography = biography.replace(/<div class="bio-text">/g, '');
    biography = biography.replace(/<div class="bio-image">.*?<\/div>/gs, '');
    biography = biography.replace(/<\/div>/g, '');
    // Remove h2 with class fiche - these are section headers within the bio
    // Keep them as they provide structure
    biography = biography.replace(/<h2 class="fiche">/g, '<h2>');
    // Clean residual classes
    biography = biography.replace(/class="p\d+"/g, '');
    biography = biography.replace(/\s+class=""/g, '');
    biography = biography.trim();
  }

  // Extract conferences from the second tab
  const conferences: { title: string; description: string }[] = [];
  const confTabMatch = html.match(/et_pb_tab_1.*?<div class="et_pb_tab_content">(.*?)<\/div>\s*<\/div>\s*<div class="et_pb_tab et_pb_tab_2/s);
  if (confTabMatch) {
    let confContent = confTabMatch[1];
    // Remove lazy-loaded images
    confContent = confContent.replace(/<img[^>]*src="data:image[^"]*"[^>]*>/g, '');
    confContent = confContent.replace(/<img[^>]*>/g, '');
    
    // Split by h2 or h4 headers to get individual conferences
    const confSections = confContent.split(/<h[24][^>]*>/);
    
    for (let i = 1; i < confSections.length; i++) {
      const section = confSections[i];
      const titleEndIdx = section.indexOf('</h');
      if (titleEndIdx === -1) continue;
      
      const title = section.substring(0, titleEndIdx).replace(/<[^>]+>/g, '').trim();
      let description = section.substring(section.indexOf('>', titleEndIdx) + 1).trim();
      
      // Clean up description
      description = description.replace(/class="p\d+"/g, '');
      description = description.replace(/\s+class=""/g, '');
      description = description.trim();
      
      if (title && description) {
        conferences.push({ title, description });
      }
    }

    // If no h2/h4 headers found but there's content, treat as single conference
    if (conferences.length === 0 && confContent.trim()) {
      const cleanContent = confContent.replace(/<h[24][^>]*>.*?<\/h[24]>/g, '').trim();
      if (cleanContent) {
        conferences.push({ title: 'Conférence', description: cleanContent });
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
    const { slugs, dryRun = false } = await req.json();
    
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
            bioPreview: extracted.biography.substring(0, 200),
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

        // Update biography and metadata
        const updateData: any = {};
        if (extracted.biography) updateData.biography = extracted.biography;
        if (extracted.keyPoints.length > 0) updateData.key_points = extracted.keyPoints;
        if (extracted.languages.length > 0) updateData.languages = extracted.languages;

        if (Object.keys(updateData).length > 0) {
          await supabase.from('speakers').update(updateData).eq('id', speaker.id);
        }

        // Update conferences only if we found them on the original site
        if (extracted.conferences.length > 0) {
          // Delete existing conferences
          await supabase.from('speaker_conferences').delete().eq('speaker_id', speaker.id);
          
          // Insert new conferences
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
          bioUpdated: !!extracted.biography,
          keyPointsUpdated: extracted.keyPoints.length > 0,
          languagesUpdated: extracted.languages.length > 0,
          conferencesReplaced: extracted.conferences.length,
        };
      } catch (err) {
        results[slug] = { error: err instanceof Error ? err.message : 'Unknown error' };
      }
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
