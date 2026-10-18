import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.lesconferenciers.com";
const NUGGET = `${SITE}/favicon.png`;
const SIGNATURE = `${SITE}/images/les-conferenciers-signature.png`;

const COMPANY_BANK = {
  iban: "FR76 XXXX XXXX XXXX XXXX XXXX XXX",
  bic: "XXXXXXXX",
};

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

    const json = (b: unknown, status = 200) =>
      new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const payload = await req.json();
    const { action, invoice_id, email_subject, email_body, to, cc } = payload;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not set" }, 500);

    // ---- Vérification du statut de livraison ----
    if (action === "check_status") {
      const { data: logs } = await adminClient
        .from("invoice_email_logs").select("id, resend_id")
        .eq("invoice_id", invoice_id).not("resend_id", "is", null);
      const results: any[] = [];
      for (const l of logs || []) {
        const r = await fetch(`https://api.resend.com/emails/${l.resend_id}`, {
          headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
        });
        const body = await r.text();
        if (!r.ok) { console.error("Resend status error", r.status, body); results.push({ id: l.id, error: body }); continue; }
        const status = JSON.parse(body)?.last_event || "sent";
        await adminClient.from("invoice_email_logs")
          .update({ last_status: status, status_checked_at: new Date().toISOString() }).eq("id", l.id);
        results.push({ id: l.id, status });
      }
      return json({ success: true, results });
    }

    if (!invoice_id) return json({ error: "invoice_id required" }, 400);
    const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
    const parseList = (v: unknown) => (Array.isArray(v) ? v : String(v || "").split(/[,;\s]+/))
      .map((e: string) => String(e || "").trim().toLowerCase()).filter(Boolean);

    const { data: invoice, error: iErr } = await adminClient
      .from("invoices")
      .select("*, proposal:proposals(client_name, client_email, recipient_name)")
      .eq("id", invoice_id)
      .single();
    if (iErr || !invoice) return json({ error: "Invoice not found" }, 404);

    const proposal = invoice.proposal;
    const recipientEmail = [...new Set(parseList(to ?? proposal.client_email))];
    const ccList = [...new Set(parseList(cc))].filter((e) => !recipientEmail.includes(e));
    const invalid = [...recipientEmail, ...ccList].filter((e) => !EMAIL_RE.test(e));
    if (invalid.length) return json({ error: `Adresse(s) invalide(s) : ${invalid.join(", ")}` }, 400);
    if (recipientEmail.length === 0) return json({ error: "recipient required" }, 400);

    const invoiceUrl = invoice.token ? `${SITE}/facture/${invoice.token}` : `${SITE}/admin/facture/${invoice.id}`;
    const bodyHtml = (email_body || `Bonjour,\n\nVeuillez trouver votre facture ${invoice.invoice_number}.\n\nCordialement,\nLes Conférenciers`).replace(/\n/g, "<br>");
    const subject = email_subject || `Facture ${invoice.invoice_number} - ${proposal.client_name}`;

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
        <a href="${invoiceUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter la facture
        </a>
      </div>
    </div>
    ${emailSignature}
    ${emailFooter}
  </div>
</body></html>`;

    const invoicePayload: any = {
      from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
      to: recipientEmail,
      subject,
      html: emailHtml,
    };
    if (ccList.length > 0) invoicePayload.cc = ccList;
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(invoicePayload),
    });
    const resText = await resendRes.text();
    if (!resendRes.ok) {
      console.error("Resend send error", resendRes.status, resText);
      let msg = resText;
      try { msg = JSON.parse(resText)?.message || resText; } catch { /* ignore */ }
      return json({ error: `Envoi refusé par le service mail : ${msg}`, status: resendRes.status }, 502);
    }
    const resendId = (() => { try { return JSON.parse(resText)?.id || null; } catch { return null; } })();
    console.log("Invoice email sent", invoice.invoice_number, resendId, recipientEmail, ccList);

    await adminClient.from("invoice_email_logs").insert({
      invoice_id, resend_id: resendId, to_emails: recipientEmail, cc_emails: ccList, subject,
    });
    await adminClient.from("invoices").update({
      status: invoice.status === "paid" ? "paid" : "sent",
      sent_at: new Date().toISOString(),
      email_to: recipientEmail.join(", "),
      email_cc: ccList.length ? ccList.join(", ") : null,
    }).eq("id", invoice_id);

    return json({ success: true, resend_id: resendId, to: recipientEmail, cc: ccList });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
