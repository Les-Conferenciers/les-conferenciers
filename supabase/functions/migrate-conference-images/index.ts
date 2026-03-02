import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function moveImageToMiddle(html: string): string {
  // Extract the img tag (with or without self-closing)
  const imgMatch = html.match(/<img\s[^>]+(?:\/>|>)/);
  if (!imgMatch) return html;

  const imgTag = imgMatch[0];
  // Remove img tag from current position
  const withoutImg = html.replace(imgTag, "").replace(/\s*$/, "");

  // Find all </p> positions
  const closingTags: number[] = [];
  let searchFrom = 0;
  while (true) {
    const pos = withoutImg.indexOf("</p>", searchFrom);
    if (pos === -1) break;
    closingTags.push(pos + 4); // position after </p>
    searchFrom = pos + 4;
  }

  if (closingTags.length < 2) return html; // Not enough paragraphs

  // Insert after the paragraph at ~50% mark
  const insertIdx = Math.floor(closingTags.length / 2);
  const insertPos = closingTags[insertIdx - 1]; // After the middle </p>

  const result =
    withoutImg.substring(0, insertPos) +
    imgTag +
    withoutImg.substring(insertPos);

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
  let skipped = 0;
  for (const conf of conferences || []) {
    const desc = conf.description || "";
    const imgPos = desc.indexOf("<img");
    if (imgPos < 0) continue;
    const pct = imgPos / desc.length;

    if (pct > 0.65) {
      const newDesc = moveImageToMiddle(desc);
      if (newDesc !== desc) {
        const { error: updateErr } = await supabase
          .from("speaker_conferences")
          .update({ description: newDesc })
          .eq("id", conf.id);
        if (updateErr) {
          console.error(`Update error for ${conf.id}:`, updateErr);
        } else {
          fixed++;
        }
      } else {
        skipped++;
        console.log(`Skipped ${conf.id}: moveImageToMiddle returned same content`);
      }
    }
  }

  console.log(`Fixed: ${fixed}, Skipped: ${skipped}, Total: ${conferences?.length}`);

  return new Response(
    JSON.stringify({ success: true, fixed, skipped, total: conferences?.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
