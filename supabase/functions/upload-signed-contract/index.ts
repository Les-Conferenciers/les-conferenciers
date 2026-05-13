import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, pdf_base64, file_name } = await req.json();
    if (!token || !pdf_base64) {
      return new Response(JSON.stringify({ error: "Missing token or pdf_base64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate token -> contract
    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("id, status")
      .eq("token", token)
      .maybeSingle();
    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64
    const binary = Uint8Array.from(atob(pdf_base64), (c) => c.charCodeAt(0));
    const path = `${contract.id}/${Date.now()}-signed.pdf`;
    const safeName = file_name || `Contrat-signe-${contract.id.slice(0, 8)}.pdf`;

    const { error: upErr } = await supabase.storage
      .from("signed-contracts")
      .upload(path, binary, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      console.error("upload error", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await supabase.from("signed_contract_files").insert({
      contract_id: contract.id,
      file_name: safeName,
      file_path: path,
      file_size: binary.byteLength,
      mime_type: "application/pdf",
    });
    if (insErr) {
      console.error("signed_contract_files insert error", insErr);
      await supabase.storage.from("signed-contracts").remove([path]);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notification email à Nelly à chaque signature de contrat (best-effort)
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        const { data: full } = await supabase
          .from("contracts")
          .select("id, signer_name, signed_at, event_date, event_location, proposal:proposals(client_name, client_email, recipient_name)")
          .eq("id", contract.id)
          .maybeSingle();
        const p = (full as any)?.proposal;
        const dateStr = (full as any)?.event_date
          ? new Date((full as any).event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
          : "à définir";
        const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;background:#fff;">
            <div style="background:#1a2332;padding:18px 24px;color:#f5f0e8;font-family:Georgia,serif;font-size:18px;font-weight:bold;">✅ Contrat signé</div>
            <div style="padding:24px;color:#333;font-size:14px;line-height:1.6;">
              <p>Bonjour Nelly,</p>
              <p>Le contrat <strong>${p?.client_name || ""}</strong> vient d'être signé électroniquement.</p>
              <ul style="padding-left:18px;">
                <li><strong>Client :</strong> ${p?.client_name || ""}${p?.recipient_name ? ` (${p.recipient_name})` : ""}</li>
                <li><strong>Email client :</strong> ${p?.client_email || "—"}</li>
                <li><strong>Signé par :</strong> ${(full as any)?.signer_name || "—"}</li>
                <li><strong>Date événement :</strong> ${dateStr}</li>
                <li><strong>Lieu :</strong> ${(full as any)?.event_location || "à définir"}</li>
              </ul>
              <p style="color:#888;font-size:12px;">Notification automatique - Les Conférenciers</p>
            </div>
          </div>
        </body></html>`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
            to: ["nellysabde@lesconferenciers.com"],
            subject: `✅ Contrat signé - ${p?.client_name || contract.id.slice(0, 6)}`,
            html,
          }),
        });
      }
    } catch (notifyErr) {
      console.error("notify-on-sign failed", notifyErr);
    }

    return new Response(JSON.stringify({ success: true, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
