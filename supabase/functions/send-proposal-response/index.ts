import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.lesconferenciers.com";
const NUGGET = `${SITE}/favicon.png`;

const emailHeader = `
<div style="background:#1a2332;padding:20px 30px;text-align:center;">
  <img src="${NUGGET}" alt="" style="width:36px;height:36px;display:inline-block;vertical-align:middle;margin-right:12px;" />
  <span style="color:#f5f0e8;font-size:20px;font-weight:bold;vertical-align:middle;font-family:Georgia,serif;">Agence Les Conférenciers</span>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_name, full_name, email, phone, message, proposal_id } = await req.json();

    if (!company_name || !full_name || !email || !message) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), { status: 400, headers: corsHeaders });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    ${emailHeader}
    <div style="background:#d4edda;padding:16px 30px;text-align:center;">
      <p style="color:#155724;font-size:16px;font-weight:bold;margin:0;">✅ Proposition acceptée — ${company_name}</p>
    </div>
    <div style="padding:30px;">
      <p style="color:#333;font-size:15px;"><strong>Société :</strong> ${company_name}</p>
      <p style="color:#333;font-size:15px;"><strong>Contact :</strong> ${full_name}</p>
      <p style="color:#333;font-size:15px;"><strong>Email :</strong> ${email}</p>
      ${phone ? `<p style="color:#333;font-size:15px;"><strong>Téléphone :</strong> ${phone}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
      <p style="color:#333;font-size:15px;"><strong>Message :</strong></p>
      <p style="color:#555;font-size:14px;white-space:pre-wrap;">${message}</p>
    </div>
    <div style="background:#1a2332;padding:14px;text-align:center;">
      <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Notification interne — Les Conférenciers</p>
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: ["nellysabde@lesconferenciers.com"],
        subject: `Proposition acceptée par ${company_name}`,
        html: emailHtml,
        reply_to: email,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
