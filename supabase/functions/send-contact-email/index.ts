import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // ─── Mode 1: Generic email (used by EventDossier for speaker/liaison emails) ───
    if (body.to) {
      const { to, subject, body: emailText, from_name, cc } = body;
      if (!to || !subject || !emailText) {
        return new Response(JSON.stringify({ error: "Missing to, subject or body" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fromAddress = `${from_name || "Les Conférenciers"} <nellysabde@lesconferenciers.com>`;

      // Convert plain text to simple HTML
      const htmlBody = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:20px;background:#1a2332;border-radius:12px 12px 0 0;">
      <h1 style="color:#f5f0e8;font-size:22px;margin:0;">Les Conférenciers</h1>
    </div>
    <div style="padding:30px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
      <div style="color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap;">${emailText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
  </div>
</body></html>`;

      const resendPayload: Record<string, unknown> = {
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: htmlBody,
      };
      if (cc && Array.isArray(cc) && cc.length > 0) {
        resendPayload.cc = cc;
      }

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(resendPayload),
      });

      if (!emailRes.ok) {
        const errData = await emailRes.text();
        console.error("Resend error:", errData);
        throw new Error(`Email sending failed [${emailRes.status}]: ${errData}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Mode 2: Contact form (original) ───
    const { name, email, company, phone, eventDate, eventType, message } = body;
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailBody = `
Nouvelle demande de devis reçue via le site web :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMATIONS DU CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom : ${name}
Email : ${email}
${company ? `Entreprise : ${company}` : ""}
${phone ? `Téléphone : ${phone}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 DÉTAILS DE L'ÉVÉNEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${eventDate ? `Date : ${eventDate}` : "Date : Non précisée"}
${eventType ? `Type : ${eventType}` : "Type : Non précisé"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}
    `.trim();

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: ["nellysabde@lesconferenciers.com"],
        subject: `Nouvelle demande de devis - ${name}${company ? ` (${company})` : ""}`,
        text: emailBody,
        reply_to: email,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.text();
      console.error("Resend error:", errData);
      throw new Error(`Email sending failed [${emailRes.status}]: ${errData}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-contact-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});