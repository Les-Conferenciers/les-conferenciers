import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all speakers with external image URLs
    const { data: speakers, error } = await supabase
      .from("speakers")
      .select("id, name, slug, image_url")
      .not("image_url", "is", null);

    if (error) throw error;

    const results: { name: string; status: string; newUrl?: string }[] = [];

    for (const speaker of speakers || []) {
      const imageUrl = speaker.image_url;
      
      // Skip if already hosted on our storage
      if (!imageUrl || imageUrl.includes(supabaseUrl)) {
        results.push({ name: speaker.name, status: "skipped" });
        continue;
      }

      try {
        // Download the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          results.push({ name: speaker.name, status: `download_failed_${response.status}` });
          continue;
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
        const fileName = `${slugify(speaker.name)}.${ext}`;
        const blob = await response.arrayBuffer();

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("speaker-photos")
          .upload(fileName, blob, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          results.push({ name: speaker.name, status: `upload_failed: ${uploadError.message}` });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("speaker-photos")
          .getPublicUrl(fileName);

        // Update speaker record
        const { error: updateError } = await supabase
          .from("speakers")
          .update({ image_url: urlData.publicUrl })
          .eq("id", speaker.id);

        if (updateError) {
          results.push({ name: speaker.name, status: `update_failed: ${updateError.message}` });
          continue;
        }

        results.push({ name: speaker.name, status: "migrated", newUrl: urlData.publicUrl });
      } catch (e) {
        results.push({ name: speaker.name, status: `error: ${e.message}` });
      }
    }

    const migrated = results.filter(r => r.status === "migrated").length;
    const failed = results.filter(r => !["migrated", "skipped"].includes(r.status)).length;

    return new Response(
      JSON.stringify({ 
        summary: { total: results.length, migrated, failed, skipped: results.length - migrated - failed },
        details: results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
