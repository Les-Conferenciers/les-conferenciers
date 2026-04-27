import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.lesconferenciers.com";
const NUGGET = `${SITE}/favicon.png`;
const SIGNATURE = `${SITE}/images/les-conferenciers-signature.png`;

const emailHeader = `
<div style="background:#1a2332;padding:20px 30px;text-align:center;">
  <img src="${NUGGET}" alt="" style="width:36px;height:36px;display:inline-block;vertical-align:middle;margin-right:12px;" />
  <span style="color:#f5f0e8;font-size:20px;font-weight:bold;vertical-align:middle;font-family:Georgia,serif;">Agence Les Conférenciers</span>
</div>`;

const emailSignature = `
<div style="padding:20px 30px 10px;">
  <img src="${SIGNATURE}" alt="Nelly SABDE | Agence Les Conférenciers" style="width:100%;max-width:500px;display:block;" />
</div>`;

const emailFooter = `
<div style="background:#1a2332;padding:14px;text-align:center;">
  <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Document confidentiel - Les Conférenciers</p>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { contract_id, email_subject, email_body, recipient_email } = await req.json();
    if (!contract_id) {
      return new Response(JSON.stringify({ error: "contract_id required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: contract, error: cErr } = await adminClient
      .from("contracts")
      .select("*, proposal:proposals(client_name, client_email, recipient_name, token, proposal_speakers(total_price, speakers(name)))")
      .eq("id", contract_id)
      .single();

    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404, headers: corsHeaders });
    }

    const proposal = contract.proposal;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const signUrl = `${SITE}/signer-contrat/${contract.token}`;
    const bodyHtml = (email_body || "").replace(/\n/g, "<br>");
    const subject = email_subject || `Contrat de prestation - ${proposal.client_name} - Les Conférenciers`;

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>.email-body p{margin:0 0 16px 0;}.email-body p:last-child{margin-bottom:0;}</style>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    ${emailHeader}
    <div style="padding:30px;">
      <div class="email-body" style="color:#333;font-size:15px;line-height:1.6;">${bodyHtml}</div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${signUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter et signer le contrat
        </a>
      </div>
    </div>
    ${emailSignature}
    ${emailFooter}
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: [recipient_email || proposal.client_email],
        subject,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), { status: 500, headers: corsHeaders });
    }

    await adminClient.from("contracts").update({ status: "sent" }).eq("id", contract_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
