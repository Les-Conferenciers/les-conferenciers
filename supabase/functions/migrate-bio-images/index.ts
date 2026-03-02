import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function downloadAndUpload(
  supabase: any,
  imageUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    // Ensure full URL
    let fullUrl = imageUrl;
    if (fullUrl.startsWith("//")) fullUrl = "https:" + fullUrl;
    if (!fullUrl.startsWith("http")) return null;

    const resp = await fetch(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConferenceBot/1.0)' }
    });
    if (!resp.ok) {
      console.log(`Download failed for ${fullUrl}: ${resp.status}`);
      return null;
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const blob = await resp.arrayBuffer();

    // Skip tiny images (likely icons/spacers)
    if (blob.byteLength < 2000) {
      console.log(`Skipping tiny image (${blob.byteLength}b): ${fullUrl}`);
      return null;
    }

    const { error: uploadError } = await supabase.storage
      .from("speaker-photos")
      .upload(fileName, blob, { contentType, upsert: true });

    if (uploadError) {
      console.log(`Upload failed for ${fileName}: ${uploadError.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("speaker-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (e) {
    console.log(`Error processing ${imageUrl}: ${e.message}`);
    return null;
  }
}

function extractImagesFromHtml(html: string): string[] {
  const imgs: string[] = [];
  // Match both src and data-src attributes
  const imgRegex = /<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/g;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    let src = m[1];
    // Skip base64 placeholders
    if (src.startsWith("data:")) {
      // Try to find data-src in the same tag
      const dataSrcMatch = m[0].match(/data-src=["']([^"']+)["']/);
      if (dataSrcMatch) {
        src = dataSrcMatch[1];
      } else {
        continue;
      }
    }
    // Only keep actual content images from wp-content
    if (src.includes("wp-content/uploads") && !src.includes("placeholder") && !src.includes("icon")) {
      // Avoid duplicates
      if (!imgs.includes(src)) {
        imgs.push(src);
      }
    }
  }
  // Also catch data-src that wasn't caught
  const dataSrcRegex = /data-src=["']([^"']+)["']/g;
  while ((m = dataSrcRegex.exec(html)) !== null) {
    const src = m[1];
    if (src.includes("wp-content/uploads") && !src.startsWith("data:") && !imgs.includes(src)) {
      imgs.push(src);
    }
  }
  return imgs;
}

function getTabContent(html: string, tabIndex: number): string {
  // The structure is: <div class="et_pb_tab et_pb_tab_X clearfix..."><div class="et_pb_tab_content">...</div></div>
  const regex = new RegExp(
    `<div\\s+class="et_pb_tab\\s+et_pb_tab_${tabIndex}\\s+clearfix[^"]*">[\\s\\S]*?<div\\s+class="et_pb_tab_content">([\\s\\S]*?)</div>\\s*</div>`,
    ''
  );
  const match = html.match(regex);
  return match ? match[1] : '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { slugs, dryRun = false } = await req.json().catch(() => ({ slugs: null, dryRun: false }));

    let query = supabase.from('speakers').select('id, slug, name, biography');
    if (slugs && Array.isArray(slugs) && slugs.length > 0) {
      query = query.in('slug', slugs);
    }
    const { data: speakers, error: fetchErr } = await query;
    if (fetchErr) throw new Error(`DB error: ${fetchErr.message}`);

    const results: any[] = [];
    let totalBioImages = 0;
    let totalConfImages = 0;

    for (const speaker of speakers || []) {
      try {
        const url = `https://www.lesconferenciers.com/conferencier/${speaker.slug}/`;
        console.log(`Fetching: ${url}`);
        
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConferenceBot/1.0)' }
        });
        
        if (!resp.ok) {
          results.push({ slug: speaker.slug, status: 'fetch_error', code: resp.status });
          continue;
        }

        const html = await resp.text();
        const speakerSlug = slugify(speaker.name);
        const speakerResult: any = { slug: speaker.slug, bioImages: 0, confImages: 0, details: [] };

        // === 1. Bio tab images (tab 0) ===
        const bioHtml = getTabContent(html, 0);
        const bioImages = extractImagesFromHtml(bioHtml);
        
        if (bioImages.length > 0) {
          let updatedBio = speaker.biography || '';
          
          for (let i = 0; i < bioImages.length; i++) {
            const oldUrl = bioImages[i];
            const ext = oldUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1] || 'jpg';
            const fileName = bioImages.length === 1 
              ? `${speakerSlug}-bio.${ext}` 
              : `${speakerSlug}-bio-${i + 1}.${ext}`;

            if (dryRun) {
              speakerResult.details.push({ type: 'bio', oldUrl, newName: fileName });
              speakerResult.bioImages++;
              continue;
            }

            const newUrl = await downloadAndUpload(supabase, oldUrl, fileName);
            if (newUrl) {
              speakerResult.details.push({ type: 'bio', oldUrl, newUrl, fileName });
              speakerResult.bioImages++;
              totalBioImages++;

              // Insert image into biography if not already present
              if (!updatedBio.includes(newUrl)) {
                const imgTag = `<img src="${newUrl}" alt="${speaker.name}" class="float-right ml-6 mb-4 rounded-lg w-64 max-w-[40%]" />`;
                if (updatedBio.startsWith('<p>')) {
                  const firstPEnd = updatedBio.indexOf('</p>');
                  if (firstPEnd > -1) {
                    updatedBio = updatedBio.slice(0, firstPEnd + 4) + imgTag + updatedBio.slice(firstPEnd + 4);
                  } else {
                    updatedBio = imgTag + updatedBio;
                  }
                } else {
                  updatedBio = imgTag + updatedBio;
                }
              }
            }
          }

          if (!dryRun && speakerResult.bioImages > 0) {
            const { error: updateErr } = await supabase
              .from('speakers')
              .update({ biography: updatedBio })
              .eq('id', speaker.id);
            if (updateErr) {
              speakerResult.bioUpdateError = updateErr.message;
            }
          }
        }

        // === 2. Conference tab images (tab 1) ===
        const confHtml = getTabContent(html, 1);
        const confImages = extractImagesFromHtml(confHtml);

        if (confImages.length > 0) {
          const { data: existingConfs } = await supabase
            .from('speaker_conferences')
            .select('id, title, description, display_order')
            .eq('speaker_id', speaker.id)
            .order('display_order');

          for (let i = 0; i < confImages.length; i++) {
            const oldUrl = confImages[i];
            const ext = oldUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1] || 'jpg';
            const fileName = confImages.length === 1
              ? `${speakerSlug}-conference.${ext}`
              : `${speakerSlug}-conference-${i + 1}.${ext}`;

            if (dryRun) {
              speakerResult.details.push({ type: 'conference', oldUrl, newName: fileName });
              speakerResult.confImages++;
              continue;
            }

            const newUrl = await downloadAndUpload(supabase, oldUrl, fileName);
            if (newUrl) {
              speakerResult.details.push({ type: 'conference', oldUrl, newUrl, fileName });
              speakerResult.confImages++;
              totalConfImages++;

              if (existingConfs && existingConfs.length > 0) {
                const confIndex = Math.min(i, existingConfs.length - 1);
                const conf = existingConfs[confIndex];
                
                if (conf.description && !conf.description.includes(newUrl)) {
                  const imgTag = `<img src="${newUrl}" alt="${conf.title}" class="rounded-lg w-full my-4" />`;
                  const updatedDesc = conf.description + imgTag;
                  
                  await supabase
                    .from('speaker_conferences')
                    .update({ description: updatedDesc })
                    .eq('id', conf.id);
                }
              }
            }
          }
        }

        results.push(speakerResult);
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        results.push({ slug: speaker.slug, status: 'error', error: err.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      totalSpeakers: speakers?.length || 0,
      totalBioImages,
      totalConfImages,
      results: results.filter(r => r.bioImages > 0 || r.confImages > 0 || r.status === 'error'),
    }, null, 2), {
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
