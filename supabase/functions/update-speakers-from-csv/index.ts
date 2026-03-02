import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractSlugFromUrl(url: string): string {
  const match = url.match(/\/conferencier\/([^/]+)\/?$/);
  return match ? match[1] : '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const localUrl = Deno.env.get('SUPABASE_URL');
    const localServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!localUrl || !localServiceKey) throw new Error('Supabase credentials not configured');

    const supabase = createClient(localUrl, localServiceKey);

    const { csvUrl } = await req.json();
    if (!csvUrl) throw new Error('No csvUrl provided');

    // Fetch CSV
    const csvResp = await fetch(csvUrl);
    if (!csvResp.ok) throw new Error(`Failed to fetch CSV: ${csvResp.status}`);
    const csvData = await csvResp.text();

    console.log(`CSV length: ${csvData.length} chars`);
    console.log(`First 200 chars: ${csvData.substring(0, 200)}`);
    const lines = csvData.split(/\r?\n|\r/).filter((l: string) => l.trim());
    const dataLines = lines.slice(1); // skip header

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
      speakerByName.set(s.name.toLowerCase().trim(), s);
    }

    let updated = 0;
    let notFound: string[] = [];
    let conferencesInserted = 0;

    for (const line of dataLines) {
      const cols = line.split(';');
      if (cols.length < 12) continue;

      const [url, nom, thematiques, pointsCles, biographie, conferences, photoUrl, videosYoutube, _associes, _telephone, languesParlees, _typeConf] = cols;

      const slug = extractSlugFromUrl(url);
      let speaker = speakerBySlug.get(slug);
      if (!speaker) {
        speaker = speakerByName.get(nom.toLowerCase().trim());
      }

      if (!speaker) {
        notFound.push(`${nom} (${slug})`);
        continue;
      }

      // Build update
      const updateData: Record<string, any> = {};

      if (videosYoutube) {
        const videos = videosYoutube.split('|').filter(Boolean);
        if (videos.length > 0) updateData.video_url = videos[0];
      }

      if (languesParlees) {
        const langs = languesParlees.split('|').map((l: string) => l.trim()).filter(Boolean);
        if (langs.length > 0) updateData.languages = langs;
      }

      if (thematiques) {
        const themes = thematiques.split('|').map((t: string) => t.trim()).filter(Boolean);
        if (themes.length > 0) updateData.themes = themes;
      }

      if (pointsCles) {
        const kp = pointsCles.split('|').map((p: string) => p.trim()).filter(Boolean);
        if (kp.length > 0) updateData.key_points = kp;
      }

      if (biographie && biographie.trim()) {
        updateData.biography = biographie.trim();
      }

      if (photoUrl && photoUrl.trim()) {
        updateData.image_url = photoUrl.trim();
      }

      if (Object.keys(updateData).length > 0) {
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

      // Process conferences
      if (conferences && conferences.trim()) {
        await supabase.from('speaker_conferences').delete().eq('speaker_id', speaker.id);

        // Split conferences by "Conférence «" or "Conférence :" patterns
        const confParts = conferences.split(/(?=Conférence\s+[«"])|(?=Conférence\s+::)/);
        
        let order = 0;
        for (const part of confParts) {
          const trimmed = part.trim();
          if (!trimmed || trimmed.length < 10) continue;

          let title = '';
          let description = '';

          const titleMatch = trimmed.match(/^Conférence\s+«\s*([^»]+)\s*»\s*(.*)/s);
          if (titleMatch) {
            title = titleMatch[1].trim();
            description = titleMatch[2].trim();
          } else {
            const colonMatch = trimmed.match(/^Conférence[s]?\s*::\s*(.*)/s);
            if (colonMatch) {
              title = 'Conférence';
              description = colonMatch[1].trim();
            } else {
              // Check for "Thèmes abordés" pattern
              const themeMatch = trimmed.match(/^Thèmes?\s+abordés?\s*:?\s*::\s*(.*)/s);
              if (themeMatch) {
                title = 'Thèmes abordés';
                description = themeMatch[1].trim();
              } else {
                title = trimmed.substring(0, Math.min(100, trimmed.length));
                description = trimmed;
              }
            }
          }

          const { error: confErr } = await supabase.from('speaker_conferences').insert({
            speaker_id: speaker.id,
            title,
            description: description || null,
            display_order: order++,
          });
          if (!confErr) conferencesInserted++;
        }
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
