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

    const { proposal_id } = await req.json();
    if (!proposal_id) {
      return new Response(JSON.stringify({ error: "proposal_id required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: proposal, error: pErr } = await adminClient
      .from("proposals")
      .select("*, proposal_speakers(total_price, speaker_fee, agency_commission, travel_costs, display_order, speakers(name, role))")
      .eq("id", proposal_id)
      .single();

    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "Proposal not found" }), { status: 404, headers: corsHeaders });
    }

    const origin = req.headers.get("origin") || "https://lesconferenciers.com";
    const proposalUrl = `${origin}/proposition/${proposal.token}`;
    const bannerUrl = `${origin}/images/les-conferenciers-banniere.png`;
    const signatureUrl = `${origin}/images/les-conferenciers-signature.png`;

    // Build speaker list for email - show HT, no commission mention
    const speakerLines = (proposal.proposal_speakers || [])
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((ps: any) => {
        const name = ps.speakers?.name || "Conférencier";
        const role = ps.speakers?.role || "";
        // Show HT price (total_price minus any TVA would be HT, but since we store HT already, just show it)
        const priceHT = ps.total_price ? `${Number(ps.total_price).toLocaleString("fr-FR")} € HT` : "";
        return `<tr>
          <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
            <strong>${name}</strong>${role ? `<br><span style="color:#888;font-size:12px;">${role}</span>` : ""}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;">
            ${priceHT}
          </td>
        </tr>`;
      })
      .join("");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    // Use custom email subject/body or defaults
    const emailSubject = proposal.email_subject || `Votre sélection de conférenciers sur mesure — ${proposal.client_name}`;
    
    // Build email body text - use custom or default
    const recipientFirstName = proposal.recipient_name ? proposal.recipient_name.split(" ")[0] : "";
    const defaultBody = `Bonjour${recipientFirstName ? ` ${recipientFirstName}` : ""},

Comme convenu, je vous transmets votre proposition personnalisée de conférenciers pour ${proposal.client_name}.

Vous y trouverez le profil complet de chaque intervenant, ses thématiques et les conditions d'intervention.`;

    const bodyText = proposal.email_body || defaultBody;
    // Convert newlines to <br> for HTML
    const bodyHtml = bodyText.replace(/\n/g, "<br>");

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Banner Header -->
    <div style="text-align:center;background:#1a2332;">
      <img src="${bannerUrl}" alt="Les Conférenciers" style="width:100%;max-width:600px;display:block;" />
    </div>
    
    <div style="padding:30px 30px 20px;">
      <div style="color:#333;font-size:15px;line-height:1.6;">${bodyHtml}</div>
      
      <table style="width:100%;border-collapse:collapse;margin:24px 0;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f8f6f1;">
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Conférencier</th>
            <th style="padding:10px 16px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Tarif HT</th>
          </tr>
        </thead>
        <tbody>
          ${speakerLines}
        </tbody>
      </table>

      <div style="text-align:center;margin:30px 0;">
        <a href="${proposalUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter la proposition complète
        </a>
      </div>
      <div style="background:#f0f7ff;border:1px solid #d0e3f7;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#1a5276;font-size:13px;margin:0;text-align:center;">
          📅 Cette proposition est <strong>valable 30 jours</strong>. Vous pouvez y revenir autant de fois que vous le souhaitez et <strong>y répondre directement en ligne</strong>.
        </p>
      </div>
    </div>

    <!-- Signature -->
    <div style="padding:0 30px 30px;">
      <img src="${signatureUrl}" alt="Nelly SABDE | Agence Les Conférenciers" style="width:100%;max-width:500px;display:block;" />
    </div>

    <div style="background:#1a2332;padding:16px;text-align:center;">
      <p style="color:#f5f0e8;opacity:0.5;font-size:11px;margin:0;">Proposition confidentielle — Les Conférenciers</p>
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <onboarding@resend.dev>",
        to: [proposal.client_email],
        subject: emailSubject,
        html: emailHtml,
      }),
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
