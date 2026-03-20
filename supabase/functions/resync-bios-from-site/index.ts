import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { slugs } = await req.json();
  const targetSlugs: string[] = slugs || [];

  // If no slugs provided, get all non-archived speakers
  let speakersToProcess: { slug: string; id: string }[] = [];
  if (targetSlugs.length > 0) {
    const { data } = await supabase
      .from("speakers")
      .select("id, slug")
      .in("slug", targetSlugs);
    speakersToProcess = data || [];
  } else {
    const { data } = await supabase
      .from("speakers")
      .select("id, slug")
      .eq("archived", false);
    speakersToProcess = data || [];
  }

  const results: { slug: string; status: string; hasImage: boolean; strongCount: number }[] = [];

  for (const speaker of speakersToProcess) {
    try {
      const url = `https://www.lesconferenciers.com/conferencier/${speaker.slug}/`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!resp.ok) {
        results.push({ slug: speaker.slug, status: `HTTP ${resp.status}`, hasImage: false, strongCount: 0 });
        continue;
      }

      const html = await resp.text();

      // Extract bio-text content
      const bioTextMatch = html.match(/<div class="bio-text">([\s\S]*?)<\/div>\s*(?:<div class="bio-image">|<\/div>\s*<\/div>)/);
      if (!bioTextMatch) {
        results.push({ slug: speaker.slug, status: "no bio-text found", hasImage: false, strongCount: 0 });
        continue;
      }

      let bioHtml = bioTextMatch[1].trim();

      // Clean up the bio HTML
      // Remove the H2/H4 with speaker name at the start
      bioHtml = bioHtml.replace(/^<h[1-6][^>]*>.*?<\/h[1-6]>\s*/i, "");
      
      // Remove empty paragraphs
      bioHtml = bioHtml.replace(/<p>&nbsp;<\/p>/g, "");
      bioHtml = bioHtml.replace(/<p>\s*<\/p>/g, "");
      
      // Clean up inline styles but keep <strong>, <em>, <b>, <i>, <p>, <br>, <a>
      // Remove data-* attributes
      bioHtml = bioHtml.replace(/\s*data-[a-z-]+="[^"]*"/g, "");
      // Remove style attributes
      bioHtml = bioHtml.replace(/\s*style="[^"]*"/g, "");
      // Remove class attributes on p tags (like class="p1")
      bioHtml = bioHtml.replace(/\s*class="[^"]*"/g, "");
      // Convert &nbsp; to regular space
      bioHtml = bioHtml.replace(/&nbsp;/g, " ");
      // Clean up multiple spaces
      bioHtml = bioHtml.replace(/  +/g, " ");
      // Trim whitespace in tags
      bioHtml = bioHtml.replace(/>\s+</g, "> <");

      // Extract bio image URL
      const bioImageMatch = html.match(/<div class="bio-image">[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"[^>]*>/);
      let bioImageUrl = "";
      if (bioImageMatch) {
        bioImageUrl = bioImageMatch[1];
        // Skip base64 images
        if (bioImageUrl.startsWith("data:")) {
          // Try data-src
          const dataSrcMatch = html.match(/<div class="bio-image">[\s\S]*?data-src="([^"]+)"/);
          bioImageUrl = dataSrcMatch ? dataSrcMatch[1] : "";
        }
      }

      // If we have a bio image, try to migrate it to storage
      let finalImageUrl = bioImageUrl;
      if (bioImageUrl) {
        try {
          const imgResp = await fetch(bioImageUrl);
          if (imgResp.ok) {
            const imgBlob = await imgResp.blob();
            const ext = bioImageUrl.split(".").pop()?.split("?")[0] || "png";
            const fileName = `${speaker.slug}-bio.${ext}`;
            
            const { error: uploadError } = await supabase.storage
              .from("speaker-photos")
              .upload(fileName, imgBlob, {
                contentType: imgBlob.type || `image/${ext}`,
                upsert: true,
              });

            if (!uploadError) {
              const { data: publicUrl } = supabase.storage
                .from("speaker-photos")
                .getPublicUrl(fileName);
              finalImageUrl = publicUrl.publicUrl;
            }
          }
        } catch {
          // Keep original URL if migration fails
        }
      }

      // Insert image into biography after 3rd paragraph if we have one
      let finalBio = bioHtml;
      if (finalImageUrl) {
        const paragraphs = bioHtml.match(/<p>[\s\S]*?<\/p>/g) || [];
        if (paragraphs.length >= 3) {
          const insertAfter = paragraphs.slice(0, 3).join("");
          const rest = bioHtml.substring(bioHtml.indexOf(insertAfter) + insertAfter.length);
          const imgTag = `<figure class="bio-inline-image"><img src="${finalImageUrl}" alt="${speaker.slug} biographie" style="max-width:100%;border-radius:8px;margin:1rem 0;" /></figure>`;
          finalBio = insertAfter + imgTag + rest;
        }
      }

      const strongCount = (finalBio.match(/<strong>/g) || []).length;

      // Update the speaker
      const { error: updateError } = await supabase
        .from("speakers")
        .update({ biography: finalBio })
        .eq("id", speaker.id);

      if (updateError) {
        results.push({ slug: speaker.slug, status: `update error: ${updateError.message}`, hasImage: !!finalImageUrl, strongCount });
      } else {
        results.push({ slug: speaker.slug, status: "ok", hasImage: !!finalImageUrl, strongCount });
      }
    } catch (err) {
      results.push({ slug: speaker.slug, status: `error: ${err.message}`, hasImage: false, strongCount: 0 });
    }
  }

  return new Response(JSON.stringify({ results, total: results.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
