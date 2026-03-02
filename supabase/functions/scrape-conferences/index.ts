import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&rsquo;/g, "'")
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&iuml;/g, 'ï')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTitle(h4Html: string): string {
  let title = stripHtml(h4Html);
  // Clean "Conférence « ... »" or "Conférence : « ... »"
  title = title.replace(/^Conférence\s*:?\s*[«"]\s*/, '').replace(/\s*[»"]\s*$/, '');
  // If it still starts with "Conférence" and has content after, keep it
  if (title === 'Conférence' || title === '') return '';
  return title.trim();
}

function parseConferences(html: string): Array<{ title: string; description: string }> {
  // Find the conference tab content (et_pb_tab_1)
  const tabMatch = html.match(/class="et_pb_tab\s+et_pb_tab_1\s+clearfix"[\s\S]*?<div\s+class="et_pb_tab_content">([\s\S]*?)<\/div>\s*<\/div>/);
  if (!tabMatch) return [];

  const content = tabMatch[1];

  // Split by h4 tags
  const h4Pattern = /<h4[^>]*>([\s\S]*?)<\/h4>/g;
  const h4Matches: Array<{ title: string; index: number; end: number }> = [];
  let match;
  while ((match = h4Pattern.exec(content)) !== null) {
    const rawTitle = match[1].trim();
    if (!rawTitle || rawTitle === '&nbsp;') continue;
    const title = extractTitle(rawTitle);
    if (!title) continue;
    h4Matches.push({ title, index: match.index, end: match.index + match[0].length });
  }

  const conferences: Array<{ title: string; description: string }> = [];

  for (let i = 0; i < h4Matches.length; i++) {
    const start = h4Matches[i].end;
    const end = i + 1 < h4Matches.length ? h4Matches[i + 1].index : content.length;
    const descHtml = content.slice(start, end);
    // Remove images
    const cleanDesc = descHtml.replace(/<img[^>]*>/g, '');
    const description = stripHtml(cleanDesc).trim();

    if (h4Matches[i].title && description.length > 10) {
      conferences.push({
        title: h4Matches[i].title,
        description,
      });
    }
  }

  return conferences;
}

function hasConferenceTab(html: string): boolean {
  return /fa-microphone/.test(html) && /Conférence/.test(html);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const localUrl = Deno.env.get('SUPABASE_URL')!;
    const localServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(localUrl, localServiceKey);

    const { slugs, dryRun = false } = await req.json().catch(() => ({ slugs: null, dryRun: false }));

    // Get speakers
    let query = client.from('speakers').select('id, slug, name');
    if (slugs && Array.isArray(slugs) && slugs.length > 0) {
      query = query.in('slug', slugs);
    }
    const { data: speakers, error: fetchErr } = await query;
    if (fetchErr) throw new Error(`DB error: ${fetchErr.message}`);

    const results: any[] = [];
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const speaker of speakers || []) {
      try {
        const url = `https://www.lesconferenciers.com/conferencier/${speaker.slug}/`;
        console.log(`Fetching: ${url}`);
        
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConferenceBot/1.0)' }
        });
        
        if (!resp.ok) {
          results.push({ slug: speaker.slug, status: 'fetch_error', code: resp.status });
          totalErrors++;
          continue;
        }

        const html = await resp.text();

        if (!hasConferenceTab(html)) {
          results.push({ slug: speaker.slug, status: 'no_conference_tab' });
          totalSkipped++;
          continue;
        }

        const conferences = parseConferences(html);

        if (conferences.length === 0) {
          results.push({ slug: speaker.slug, status: 'no_conferences_found', hasTab: true });
          totalSkipped++;
          continue;
        }

        if (!dryRun) {
          // Delete existing conferences for this speaker
          await client.from('speaker_conferences').delete().eq('speaker_id', speaker.id);

          // Insert new ones
          const rows = conferences.map((c, idx) => ({
            speaker_id: speaker.id,
            title: c.title,
            description: c.description,
            display_order: idx,
          }));

          const { error: insertErr } = await client.from('speaker_conferences').insert(rows);
          if (insertErr) {
            results.push({ slug: speaker.slug, status: 'insert_error', error: insertErr.message });
            totalErrors++;
            continue;
          }
        }

        results.push({
          slug: speaker.slug,
          status: 'ok',
          conferences: conferences.map(c => c.title),
          count: conferences.length,
        });
        totalAdded += conferences.length;

        // Small delay to be polite
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        results.push({ slug: speaker.slug, status: 'error', error: err.message });
        totalErrors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      totalSpeakers: speakers?.length || 0,
      totalConferencesAdded: totalAdded,
      totalSkipped,
      totalErrors,
      results,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
