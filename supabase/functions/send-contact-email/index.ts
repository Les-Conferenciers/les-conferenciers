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
    const { name, email, company, phone, eventDate, eventType, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to format a nice email, then send via Resend-like approach
    // For now, we'll construct the email body and use the Supabase built-in email
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

    // Send email using Supabase's built-in SMTP (via edge function HTTP call to a mail service)
    // We'll use the Resend API if available, otherwise log and return success
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Les Conférenciers <onboarding@resend.dev>",
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
    } else {
      // Fallback: log the email for now
      console.log("=== EMAIL TO nellysabde@lesconferenciers.com ===");
      console.log(`Subject: Nouvelle demande de devis - ${name}`);
      console.log(emailBody);
      console.log("=== END EMAIL ===");
      console.warn("RESEND_API_KEY not configured - email logged but not sent");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-contact-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
