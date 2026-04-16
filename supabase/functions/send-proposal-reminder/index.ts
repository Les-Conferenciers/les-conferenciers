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
  <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Proposition confidentielle - Les Conférenciers</p>
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

    const { proposal_id, reminder_number, custom_subject, custom_html_body } = await req.json();
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

    const proposalUrl = `${SITE}/proposition/${proposal.token}`;
    const recipientFirstName = proposal.recipient_name?.split(" ")[0] || "";
    const reminderNum = reminder_number || 1;
    const proposalType = proposal.proposal_type || "classique";

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

    // Use custom subject/body if provided, otherwise use defaults
    let emailSubject: string;
    let bodyHtml: string;

    if (custom_subject) {
      emailSubject = custom_subject;
    } else {
      emailSubject = reminderNum === 1
        ? `Votre sélection de conférenciers - ${proposal.client_name}`
        : `Rappel : votre recherche d'intervenants - ${proposal.client_name}`;
    }

    if (custom_html_body) {
      // Use the custom HTML body directly
      bodyHtml = custom_html_body;
    } else {
      // Default templates per type
      const speakerName = (proposal.proposal_speakers || [])?.[0]?.speakers?.name || "l'intervenant";
      let messageText: string;

      if (proposalType === "unique") {
        if (reminderNum === 1) {
          messageText = `Bonjour,\n\nJ'espère que vous allez bien ! 🙂\n\nJe me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d'intervenants.\n\nJe souhaitais savoir si le profil de ${speakerName} avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.\n\nJe reste bien évidemment à votre disposition si besoin est.\n\nDans l'attente de votre retour.\n\nTrès belle fin de journée à vous.`;
        } else {
          messageText = `Bonjour,\n\nJe reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants. 🙂\n\nJe souhaitais savoir si l'intervention de ${speakerName} était toujours d'actualité.\n\nJe reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.\n\nDans l'attente de votre retour, je vous souhaite une très belle fin de journée.\n\nBien à vous,`;
        }
      } else if (proposalType === "info") {
        messageText = `Bonjour,\n\nJe reviens vers vous suite à votre retour et je me réjouis de notre future collaboration.\n\nAfin d'avancer sur l'organisation de la venue de ${speakerName}, pouvez-vous me communiquer le numéro de RCS de l'entité à facturer, la taille de l'auditoire et les horaires souhaités.\n\nNous pourrons dans un second temps prévoir un échange avec l'intervenant.\n\nRestant à votre écoute et dans l'attente de votre retour, je vous souhaite une excellente journée.`;
      } else {
        // classique
        if (reminderNum === 1) {
          messageText = `Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},\n\nJ'espère que vous allez bien !\n\nJe me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d'intervenants 🙂\n\nJe souhaitais savoir si un des profils avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.\n\nJe reste bien évidemment à votre disposition si besoin est.\n\nDans l'attente de votre retour.\n\nTrès belle fin de journée à vous.`;
        } else {
          messageText = `Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},\n\nJe reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants 🙂\n\nJe souhaitais savoir si vous aviez pu avancer dans votre réflexion quant au choix de l'intervenant qui correspondrait le mieux à vos besoins.\n\nJe reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.\n\nDans l'attente de votre retour, je vous souhaite une très belle fin de journée.`;
        }
      }
      bodyHtml = `<div style="color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap;">${messageText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
    }

    const urgencyColor = remainingDays <= 7 ? "#dc2626" : "#f59e0b";
    const urgencyText = remainingDays <= 3
      ? `⚠️ Attention : votre proposition expire dans ${remainingDays} jour${remainingDays > 1 ? "s" : ""} !`
      : `Votre proposition est encore disponible pendant ${remainingDays} jours.`;

    // Only show speaker list and proposal button for "classique" proposals
    const speakerBlock = proposalType === "classique" ? `
      <div style="background:#f8f6f1;padding:20px;border-radius:8px;margin:20px 0;">
        <p style="font-size:13px;color:#666;margin:0 0 8px 0;font-weight:bold;">Votre sélection :</p>
        <pre style="font-family:Arial,sans-serif;color:#333;font-size:14px;white-space:pre-wrap;margin:0;">${speakerLines}</pre>
      </div>` : "";

    const urgencyBlock = proposalType === "classique" ? `
      <div style="background:${urgencyColor}15;border-left:4px solid ${urgencyColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="color:${urgencyColor};font-size:14px;font-weight:bold;margin:0;">${urgencyText}</p>
      </div>` : "";

    const proposalButton = proposalType === "classique" ? `
      <div style="text-align:center;margin:30px 0;">
        <a href="${proposalUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter la proposition
        </a>
      </div>` : "";

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    ${emailHeader}
    <div style="padding:30px;">
      ${bodyHtml}
      ${speakerBlock}
      ${urgencyBlock}
      ${proposalButton}
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
