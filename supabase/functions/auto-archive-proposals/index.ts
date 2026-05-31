import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: candidates, error: selErr } = await supabase
      .from("proposals")
      .select("id, lost_reason")
      .eq("status", "sent")
      .not("reminder2_sent_at", "is", null)
      .lt("reminder2_sent_at", cutoff);

    if (selErr) throw selErr;

    const now = new Date().toISOString();
    let archived = 0;
    for (const p of candidates || []) {
      const reason = p.lost_reason && p.lost_reason.trim()
        ? p.lost_reason
        : "[Sans réponse] Pas de réponse après relances";
      const { error } = await supabase
        .from("proposals")
        .update({ status: "archived", lost_at: now, lost_reason: reason })
        .eq("id", p.id);
      if (!error) archived++;
    }

    return new Response(JSON.stringify({ ok: true, archived, candidates: candidates?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-archive-proposals error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
