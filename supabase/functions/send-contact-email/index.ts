import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
  <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Les Conférenciers</p>
</div>`;

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

      const htmlBody = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    ${emailHeader}
    <div style="padding:30px;">
      <div style="color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap;">${emailText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
    ${emailSignature}
    ${emailFooter}
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

    // ─── Mode 2: Contact form (internal notification + auto-confirmation to lead) ───
    const { name, email, company, phone, eventDate, eventLocation, audienceSize, message } = body;
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save as lead in simulator_leads table — and capture the lead id so we can store the confirmation message id
    let leadId: string | null = null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);
    try {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const { data: leadRow } = await sb.from("simulator_leads").insert({
        first_name: firstName,
        last_name: lastName,
        email,
        additional_info: message,
        lead_type: "Contact",
        company: company || null,
        phone: phone || null,
        event_date: eventDate || null,
        location: eventLocation || null,
        audience_size: audienceSize || null,
      }).select("id").single();
      leadId = leadRow?.id || null;
    } catch (e) {
      console.error("Failed to save contact lead:", e);
    }

    const internalEmailBody = `
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
${eventLocation ? `Lieu : ${eventLocation}` : "Lieu : Non précisé"}
${audienceSize ? `Auditoire : ${audienceSize} personnes` : "Auditoire : Non précisé"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}
    `.trim();

    const internalRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: ["nellysabde@lesconferenciers.com"],
        subject: `Nouvelle demande de devis - ${name}${company ? ` (${company})` : ""}`,
        text: internalEmailBody,
        reply_to: email,
      }),
    });

    if (!internalRes.ok) {
      const errData = await internalRes.text();
      console.error("Resend internal error:", errData);
      throw new Error(`Email sending failed [${internalRes.status}]: ${errData}`);
    }

    // ─── Auto-confirmation to the prospect (allows future proposal email to thread as a "Re:") ───
    const firstNameOnly = name.trim().split(/\s+/)[0] || "";
    const confirmationSubject = `Votre demande - Les Conférenciers`;
    const confirmationHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    ${emailHeader}
    <div style="padding:30px;color:#333;font-size:15px;line-height:1.6;">
      <p>Bonjour${firstNameOnly ? ` ${firstNameOnly}` : ""},</p>
      <p>Merci pour votre demande, je l'ai bien reçue et reviens vers vous très rapidement avec une proposition adaptée à votre événement.</p>
      <p>Belle journée,</p>
      <p><strong>Nelly Sabde</strong><br/>Agence Les Conférenciers<br/>📞 06 95 93 97 91</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#888;margin:0 0 8px;"><em>Pour rappel, votre demande :</em></p>
      ${(eventDate || eventLocation || audienceSize) ? `<table cellpadding="0" cellspacing="0" style="font-size:13px;color:#555;margin:0 0 12px;">
        ${eventDate ? `<tr><td style="padding:2px 8px 2px 0;color:#888;">Date :</td><td style="padding:2px 0;">${String(eventDate).replace(/</g, "&lt;")}</td></tr>` : ""}
        ${eventLocation ? `<tr><td style="padding:2px 8px 2px 0;color:#888;">Lieu :</td><td style="padding:2px 0;">${String(eventLocation).replace(/</g, "&lt;")}</td></tr>` : ""}
        ${audienceSize ? `<tr><td style="padding:2px 8px 2px 0;color:#888;">Auditoire :</td><td style="padding:2px 0;">${String(audienceSize).replace(/</g, "&lt;")} personnes</td></tr>` : ""}
      </table>` : ""}
      <blockquote style="border-left:3px solid #d9c9a3;padding:8px 12px;margin:0;color:#555;font-size:13px;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</blockquote>
    </div>
    ${emailSignature}
    ${emailFooter}
  </div>
</body></html>`;

    // Generate our own deterministic Message-ID so we can reliably thread the proposal as a reply.
    const customMessageIdCore = `lead-${leadId || crypto.randomUUID()}-${Date.now()}@lesconferenciers.com`;
    const customMessageIdHeader = `<${customMessageIdCore}>`;

    try {
      const confirmRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Nelly Sabde <nellysabde@lesconferenciers.com>",
          to: [email],
          subject: confirmationSubject,
          html: confirmationHtml,
          reply_to: "nellysabde@lesconferenciers.com",
          headers: {
            "Message-ID": customMessageIdHeader,
          },
        }),
      });
      if (confirmRes.ok) {
        if (leadId) {
          await sb.from("simulator_leads")
            .update({ confirmation_message_id: customMessageIdHeader } as any)
            .eq("id", leadId);
        }
      } else {
        console.error("Confirmation email failed:", await confirmRes.text());
      }
    } catch (e) {
      console.error("Confirmation email exception:", e);
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
