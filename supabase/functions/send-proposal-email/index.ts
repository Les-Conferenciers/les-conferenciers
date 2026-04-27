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

    const { proposal_id, cc } = await req.json();
    if (!proposal_id) {
      return new Response(JSON.stringify({ error: "proposal_id required" }), { status: 400, headers: corsHeaders });
    }
    const ccList = Array.isArray(cc) ? cc.filter((e: string) => e && e.includes("@")) : [];

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: proposal, error: pErr } = await adminClient
      .from("proposals")
      .select("*, proposal_speakers(total_price, speaker_fee, agency_commission, travel_costs, display_order, speakers(name, role, slug))")
      .eq("id", proposal_id)
      .single();

    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "Proposal not found" }), { status: 404, headers: corsHeaders });
    }

    const siteOrigin = "https://www.lesconferenciers.com";
    const proposalUrl = `${siteOrigin}/proposition/${proposal.token}`;
    const nuggetUrl = `${siteOrigin}/favicon.png`;
    const signatureUrl = `${siteOrigin}/images/les-conferenciers-signature.png`;

    // No more speaker price table in email - users must click to view the full proposal

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const recipientFirstName = proposal.recipient_name ? proposal.recipient_name.split(" ")[0] : "";
    const escapeHtml = (value: string) => value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const hasHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);
    const getProposalSpeakerTotal = (speaker: any) => speaker?.total_price ?? ((speaker?.speaker_fee || 0) + (speaker?.travel_costs || 0) + (speaker?.agency_commission || 0));
    const uniqueSpeaker = (proposal.proposal_speakers || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))[0];
    const uniqueSpeakerName = uniqueSpeaker?.speakers?.name || "ce conférencier";
    const uniqueSpeakerSlug = uniqueSpeaker?.speakers?.slug || "";
    const uniqueSpeakerTotal = getProposalSpeakerTotal(uniqueSpeaker).toLocaleString("fr-FR");
    const uniqueProfileUrl = uniqueSpeakerSlug ? `${siteOrigin}/conferencier/${uniqueSpeakerSlug}` : "";
    const normalizeEmailBodyHtml = (value: string) => {
      if (!value?.trim()) return "";
      if (hasHtmlContent(value)) return value;

      return escapeHtml(value)
        .replace(/👉\s*Découvrir le profil de ([^:\n]+)\s*:\s*(https?:\/\/[^\s<]+)/g, '👉 <a href="$2" target="_blank" rel="noopener noreferrer">Découvrir le profil de $1</a>')
        .replace(/\n/g, "<br>");
    };

    const eventContextParts: string[] = [];
    if (proposal.event_date_text) eventContextParts.push(`du <strong>${proposal.event_date_text}</strong>`);
    if (proposal.event_location) eventContextParts.push(`qui se tiendra à <strong>${proposal.event_location}</strong>`);
    if (proposal.audience_size) eventContextParts.push(`devant un auditoire d'environ <strong>${proposal.audience_size} personnes</strong>`);
    const classicSelectionLine = eventContextParts.length
      ? `<p>Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour votre événement ${eventContextParts.join(", ")}.</p>`
      : `<p>Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour ${proposal.client_name || "votre événement"}.</p>`;

    const defaultClassicBody = `<p>Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},</p>

<p>Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.</p>

${classicSelectionLine}

<p>Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.</p>

<p><strong>👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.</strong></p>

<p>Je reste bien entendu à votre disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
    const uniqueContextParts: string[] = [];
    if (proposal.event_date_text) uniqueContextParts.push(`du <strong>${proposal.event_date_text}</strong>`);
    if (proposal.event_location) uniqueContextParts.push(`qui aura lieu à <strong>${proposal.event_location}</strong>`);
    if (proposal.audience_size) uniqueContextParts.push(`pour un auditoire d'environ <strong>${proposal.audience_size} personnes</strong>`);
    const uniqueIntroPhrase = uniqueContextParts.length
      ? `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants concernant votre événement ${uniqueContextParts.join(", ")}, et vous adresse, comme convenu, le profil de ${uniqueSpeakerName}.`
      : `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants et vous adresse, comme convenu, le profil de ${uniqueSpeakerName}.`;

    const defaultUniqueBody = `<p>Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},</p>

<p>Je fais suite à votre mail et à ma tentative de vous joindre par téléphone.</p>

<p>${uniqueIntroPhrase} Le tarif de son intervention est de ${uniqueSpeakerTotal} € HT, hors frais VHR.</p>

${uniqueProfileUrl ? `<p><strong>👉 <a href="${uniqueProfileUrl}" target="_blank" rel="noopener noreferrer">Découvrir le profil de ${uniqueSpeakerName}</a></strong> (sous réserve de sa disponibilité)</p>` : ""}

<p>Si toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d'autres intervenants adaptés à vos critères.<br>👉 À ce titre, pourriez-vous m'indiquer la taille de l'auditoire envisagé ainsi que l'enveloppe budgétaire disponible ?</p>

<p>Je reste bien entendu à votre entière disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
    const defaultInfoBody = `Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},

Merci pour votre message. J'ai tenté de vous joindre par téléphone sans succès et me permets donc de revenir vers vous par écrit.

Je serais ravie de vous accompagner dans votre recherche d'intervenants. Afin de pouvoir vous proposer des profils parfaitement adaptés à vos besoins, pourriez-vous m'apporter quelques précisions concernant :

• La taille de l'auditoire
• Le profil des participants (commerciaux, managers, experts, etc.)
• La durée souhaitée pour l'intervention
• La thématique à aborder
• Votre enveloppe budgétaire

Ces informations me permettront de cibler au mieux les conférenciers à vous suggérer.

Je reste bien entendu à votre disposition pour en discuter de vive voix si vous le souhaitez.

Dans l'attente de votre retour, je vous souhaite une très belle journée.

Nelly Sabde - Les Conférenciers
📞 06 95 93 97 91`;

    const emailSubject = proposal.email_subject || `Votre sélection de conférenciers sur mesure - ${proposal.client_name}`;
    const defaultBody = proposal.proposal_type === "unique"
      ? defaultUniqueBody
      : proposal.proposal_type === "info"
        ? defaultInfoBody
        : defaultClassicBody;
    const bodyHtml = normalizeEmailBodyHtml(proposal.email_body || defaultBody);
    const showProposalButton = proposal.proposal_type !== "unique" && proposal.proposal_type !== "info";

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#1a2332;padding:20px 30px;text-align:center;">
      <img src="${nuggetUrl}" alt="" style="width:36px;height:36px;display:inline-block;vertical-align:middle;margin-right:12px;" />
      <span style="color:#f5f0e8;font-size:20px;font-weight:bold;vertical-align:middle;font-family:Georgia,serif;">Agence Les Conférenciers</span>
    </div>
    
    <div style="padding:30px 30px 20px;">
      <div style="color:#333;font-size:15px;line-height:1.6;">${bodyHtml}</div>
      ${showProposalButton ? `<div style="text-align:center;margin:30px 0;">
        <a href="${proposalUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter la proposition complète
        </a>
      </div>
      <div style="background:#f0f7ff;border:1px solid #d0e3f7;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#1a5276;font-size:13px;margin:0;text-align:center;">
          📅 Cette proposition est <strong>valable 30 jours</strong>. Vous pouvez y revenir autant de fois que vous le souhaitez et <strong>y répondre directement en ligne</strong>.
        </p>
      </div>` : ""}
    </div>

    <!-- Signature -->
    <div style="padding:0 30px 30px;">
      <img src="${signatureUrl}" alt="Nelly SABDE | Agence Les Conférenciers" style="width:100%;max-width:500px;display:block;" />
    </div>

    <div style="background:#1a2332;padding:16px;text-align:center;">
      <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Proposition confidentielle - Les Conférenciers</p>
    </div>
  </div>
</body></html>`;

    const emailPayload: any = {
      from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
      to: [proposal.client_email],
      subject: emailSubject,
      html: emailHtml,
    };
    if (ccList.length > 0) {
      emailPayload.cc = ccList;
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(emailPayload),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), { status: 500, headers: corsHeaders });
    }

    // Mark as sent
    await adminClient.from("proposals").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", proposal_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
