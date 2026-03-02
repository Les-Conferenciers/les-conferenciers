import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractSlugFromUrl(url: string): string {
  // URL format: https://www.lesconferenciers.com/conferencier/slug-name/
  const match = url.match(/\/conferencier\/([^/]+)\/?$/);
  return match ? match[1] : '';
}

function parseCSVLine(line: string): string[] {
  // Simple semicolon split - the CSV uses ; as delimiter
  return line.split(';');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const localUrl = Deno.env.get('SUPABASE_URL');
    const localServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!localUrl || !localServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(localUrl, localServiceKey);

    const { csvData } = await req.json();
    if (!csvData) throw new Error('No csvData provided');

    const lines = csvData.split('\n').filter((l: string) => l.trim());
    const header = lines[0];
    const dataLines = lines.slice(1);

    console.log(`Processing ${dataLines.length} CSV rows`);

    // Get all existing speakers
    const { data: existingSpeakers, error: fetchErr } = await supabase
      .from('speakers')
      .select('id, name, slug');
    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);

    const speakerBySlug = new Map<string, any>();
    const speakerByName = new Map<string, any>();
    for (const s of existingSpeakers || []) {
      speakerBySlug.set(s.slug, s);
      speakerByName.set(s.name.toLowerCase(), s);
    }

    let updated = 0;
    let notFound: string[] = [];

    for (const line of dataLines) {
      const cols = parseCSVLine(line);
      if (cols.length < 12) continue;

      const [url, nom, thematiques, pointsCles, biographie, conferences, photoUrl, videosYoutube, _associes, _telephone, languesParlees, _typeConf] = cols;

      const slug = extractSlugFromUrl(url);
      
      // Match by slug first, then by name
      let speaker = speakerBySlug.get(slug);
      if (!speaker) {
        speaker = speakerByName.get(nom.toLowerCase());
      }

      if (!speaker) {
        notFound.push(`${nom} (${slug})`);
        continue;
      }

      // Build update object
      const updateData: Record<string, any> = {};

      // Video URL - take first one
      if (videosYoutube) {
        const videos = videosYoutube.split('|').filter(Boolean);
        if (videos.length > 0) {
          updateData.video_url = videos[0];
        }
      }

      // Languages
      if (languesParlees) {
        const langs = languesParlees.split('|').map((l: string) => l.trim()).filter(Boolean);
        if (langs.length > 0) {
          updateData.languages = langs;
        }
      }

      // Themes
      if (thematiques) {
        const themes = thematiques.split('|').map((t: string) => t.trim()).filter(Boolean);
        if (themes.length > 0) {
          updateData.themes = themes;
        }
      }

      // Key points
      if (pointsCles) {
        const kp = pointsCles.split('|').map((p: string) => p.trim()).filter(Boolean);
        if (kp.length > 0) {
          updateData.key_points = kp;
        }
      }

      // Biography
      if (biographie && biographie.trim()) {
        updateData.biography = biographie.trim();
      }

      // Image URL
      if (photoUrl && photoUrl.trim()) {
        updateData.image_url = photoUrl.trim();
      }

      if (Object.keys(updateData).length === 0) continue;

      const { error: updateErr } = await supabase
        .from('speakers')
        .update(updateData)
        .eq('id', speaker.id);

      if (updateErr) {
        console.error(`Update error for ${nom}: ${updateErr.message}`);
      } else {
        updated++;
      }
    }

    // Now process conferences from CSV
    let conferencesInserted = 0;
    for (const line of dataLines) {
      const cols = parseCSVLine(line);
      if (cols.length < 6) continue;

      const [url, nom, , , , conferences] = cols;
      if (!conferences || !conferences.trim()) continue;

      const slug = extractSlugFromUrl(url);
      let speaker = speakerBySlug.get(slug) || speakerByName.get(nom.toLowerCase());
      if (!speaker) continue;

      // Delete existing conferences for this speaker
      await supabase.from('speaker_conferences').delete().eq('speaker_id', speaker.id);

      // Parse conferences - they're separated by title patterns like "Conférence « Title »" or "Conférence ::"
      // Simple approach: split by "Conférence " pattern
      const confTexts = conferences.split(/Conférence\s+[«"]/);
      
      let order = 0;
      for (const confText of confTexts) {
        if (!confText.trim()) continue;
        
        // Try to extract title and description
        const titleMatch = confText.match(/^([^»"]+)[»"]\s*(.*)/s);
        let title: string;
        let description: string;
        
        if (titleMatch) {
          title = `Conférence « ${titleMatch[1].trim()} »`;
          description = titleMatch[2].trim();
        } else {
          // Fallback: use first 100 chars as title
          title = confText.substring(0, 100).trim();
          description = confText.trim();
        }

        if (title.length < 5) continue;

        const { error: confErr } = await supabase.from('speaker_conferences').insert({
          speaker_id: speaker.id,
          title,
          description: description || null,
          display_order: order++,
        });

        if (!confErr) conferencesInserted++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalCSVRows: dataLines.length,
      updated,
      notFound,
      conferencesInserted,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
