import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px;background:#1a2332;border-radius:12px 12px 0 0;">
      <h1 style="color:#f5f0e8;font-size:24px;margin:0;">Proposition acceptée</h1>
      <p style="color:#f5f0e8;opacity:0.7;font-size:14px;margin-top:8px;">${company_name}</p>
    </div>
    <div style="padding:30px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
      <p style="color:#333;font-size:15px;"><strong>Société :</strong> ${company_name}</p>
      <p style="color:#333;font-size:15px;"><strong>Contact :</strong> ${full_name}</p>
      <p style="color:#333;font-size:15px;"><strong>Email :</strong> ${email}</p>
      ${phone ? `<p style="color:#333;font-size:15px;"><strong>Téléphone :</strong> ${phone}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
      <p style="color:#333;font-size:15px;"><strong>Message :</strong></p>
      <p style="color:#555;font-size:14px;white-space:pre-wrap;">${message}</p>
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <onboarding@resend.dev>",
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
