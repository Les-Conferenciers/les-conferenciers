import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { proposal_id, reminder_number } = await req.json();
    if (!proposal_id) {
      return new Response(JSON.stringify({ error: "proposal_id required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: proposal, error: pErr } = await adminClient
      .from("proposals")
      .select("*, proposal_speakers(total_price, display_order, speakers(name, role))")
      .eq("id", proposal_id)
      .single();

    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "Proposal not found" }), { status: 404, headers: corsHeaders });
    }

    const proposalUrl = `https://les-conferenciers.netlify.app/proposition/${proposal.token}`;
    const recipientFirstName = proposal.recipient_name?.split(" ")[0] || "";
    const reminderNum = reminder_number || 1;

    // Calculate remaining days
    const expiresAt = new Date(proposal.expires_at);
    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const speakerLines = (proposal.proposal_speakers || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((ps: any) => `• ${ps.speakers?.name || "Conférencier"}`)
      .join("\n");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    // Different templates for reminder 1 and 2
    let emailSubject: string;
    let messageText: string;

    if (reminderNum === 1) {
      emailSubject = `Votre sélection de conférenciers — ${proposal.client_name}`;
      messageText = `Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},

J'espère que vous allez bien !

Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d'intervenants.

Je souhaitais savoir si un des profils avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.

Je reste bien évidemment à votre disposition si besoin est.

Dans l'attente de votre retour.

Très belle fin de journée à vous.

Nelly Sabde — Les Conférenciers`;
    } else {
      emailSubject = `Rappel : votre recherche d'intervenants — ${proposal.client_name}`;
      messageText = `Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},

Je reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants.

Je souhaitais savoir si vous aviez pu avancer dans votre réflexion quant au choix de l'intervenant qui correspondrait le mieux à vos besoins.

Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.

Dans l'attente de votre retour, je vous souhaite une très belle fin de journée.

Bien à vous,
Nelly Sabde — Les Conférenciers`;
    }

    const urgencyColor = remainingDays <= 7 ? "#dc2626" : "#f59e0b";
    const urgencyText = remainingDays <= 3
      ? `⚠️ Attention : votre proposition expire dans ${remainingDays} jour${remainingDays > 1 ? "s" : ""} !`
      : `Votre proposition est encore disponible pendant ${remainingDays} jours.`;

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px;background:#1a2332;border-radius:12px 12px 0 0;">
      <h1 style="color:#f5f0e8;font-size:24px;margin:0;">Les Conférenciers</h1>
    </div>
    <div style="padding:30px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
      <div style="color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap;">${messageText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      <div style="background:#f8f6f1;padding:20px;border-radius:8px;margin:20px 0;">
        <p style="font-size:13px;color:#666;margin:0 0 8px 0;font-weight:bold;">Votre sélection :</p>
        <pre style="font-family:Arial,sans-serif;color:#333;font-size:14px;white-space:pre-wrap;margin:0;">${speakerLines}</pre>
      </div>
      <div style="background:${urgencyColor}15;border-left:4px solid ${urgencyColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="color:${urgencyColor};font-size:14px;font-weight:bold;margin:0;">${urgencyText}</p>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${proposalUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter la proposition
        </a>
      </div>
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: [proposal.client_email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, reminder_number: reminderNum, remaining_days: remainingDays }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});