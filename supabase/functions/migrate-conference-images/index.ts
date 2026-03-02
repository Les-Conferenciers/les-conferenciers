import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function moveImageToMiddle(html: string): string {
  // Extract the img tag
  const imgMatch = html.match(/<img\s[^>]+(?:\/>|>)/);
  if (!imgMatch) return html;

  const imgTag = imgMatch[0];
  const withoutImg = html.replace(imgTag, "").replace(/\s*$/, "");

  // Try </p> boundaries first
  const pClosings: number[] = [];
  let idx = 0;
  while (true) {
    const pos = withoutImg.indexOf("</p>", idx);
    if (pos === -1) break;
    pClosings.push(pos + 4);
    idx = pos + 4;
  }

  if (pClosings.length >= 2) {
    const insertIdx = Math.floor(pClosings.length / 2);
    const insertPos = pClosings[insertIdx - 1];
    return withoutImg.substring(0, insertPos) + imgTag + withoutImg.substring(insertPos);
  }

  // No <p> tags — plain text. Find the sentence closest to 50% of the text
  const textLen = withoutImg.length;
  const midpoint = Math.floor(textLen / 2);
  
  // Find sentence boundaries (. followed by space or uppercase)
  const sentenceEnds: number[] = [];
  for (let i = 20; i < textLen - 20; i++) {
    if (withoutImg[i] === "." && (withoutImg[i + 1] === " " || withoutImg[i + 1] === "\n")) {
      sentenceEnds.push(i + 1);
    }
  }

  if (sentenceEnds.length < 2) return html; // Can't split meaningfully

  // Find the sentence end closest to the midpoint
  let bestPos = sentenceEnds[0];
  let bestDist = Math.abs(bestPos - midpoint);
  for (const pos of sentenceEnds) {
    const dist = Math.abs(pos - midpoint);
    if (dist < bestDist) {
      bestDist = dist;
      bestPos = pos;
    }
  }

  return withoutImg.substring(0, bestPos) + " " + imgTag + " " + withoutImg.substring(bestPos);
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
