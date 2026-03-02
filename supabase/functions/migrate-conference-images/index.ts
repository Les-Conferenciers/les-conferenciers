import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function moveImageToMiddle(html: string): string {
  // Extract the img tag
  const imgMatch = html.match(/<img[^>]+(?:\/>|>)/);
  if (!imgMatch) return html;

  const imgTag = imgMatch[0];
  // Remove img tag from current position
  const withoutImg = html.replace(imgTag, "").trim();

  // Split by </p> to find paragraph boundaries
  const parts = withoutImg.split("</p>");
  // Filter out empty parts
  const paragraphs = parts.filter((p) => p.trim().length > 0);

  if (paragraphs.length < 2) return html; // Not enough paragraphs

  // Insert after the paragraph closest to the middle
  const insertAfter = Math.ceil(paragraphs.length / 2);

  const result = paragraphs
    .map((p, i) => {
      const closed = p.trim() + "</p>";
      if (i === insertAfter - 1) {
        return closed + imgTag;
      }
      return closed;
    })
    .join("");

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get all conferences with images positioned in the last 30%
  const { data: conferences, error } = await supabase
    .from("speaker_conferences")
    .select("id, description")
    .like("description", "%<img%");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let fixed = 0;
  for (const conf of conferences || []) {
    const desc = conf.description || "";
    const imgPos = desc.indexOf("<img");
    const pct = imgPos / desc.length;

    if (pct > 0.7) {
      const newDesc = moveImageToMiddle(desc);
      if (newDesc !== desc) {
        await supabase
          .from("speaker_conferences")
          .update({ description: newDesc })
          .eq("id", conf.id);
        fixed++;
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, fixed, total: conferences?.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
