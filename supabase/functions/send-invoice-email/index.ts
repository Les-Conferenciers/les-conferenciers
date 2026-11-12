import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const PENNYLANE_EMAIL = "eve-v5pdlydq@customers.pennylane.com";
const eur = (n: number) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202f|\u00a0/g, " ") + " EUR";
const clean = (t: unknown) => String(t ?? "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, "");

// PDF de secours généré côté serveur (si l'écran n'a pas fourni le PDF)
async function buildInvoicePdf(inv: any, proposal: any): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const f = await doc.embedFont(StandardFonts.Helvetica);
  const b = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = 790;
  const t = (s: string, x = 50, bold = false, size = 10) => { page.drawText(clean(s), { x, y, size, font: bold ? b : f, color: rgb(0.1, 0.14, 0.2) }); };
  const nl = (h = 15) => { y -= h; };
  t("EVE - LES CONFERENCIERS", 50, true, 14); nl(18);
  t("SAS - 4 B Villa de la Gare, 92140 Clamart"); nl();
  t("SIRET 848 829 743 00014 - TVA FR39 848 829 743"); nl();
  t("contact@lesconferenciers.com"); nl(35);
  const typeLabel = inv.invoice_type === "deposit" || inv.invoice_type === "acompte" ? "FACTURE D'ACOMPTE" : "FACTURE";
  t(`${typeLabel} N° ${inv.invoice_number}`, 50, true, 16); nl(22);
  const d = new Date(inv.sent_at || inv.created_at || Date.now());
  t(`Date : ${d.toLocaleDateString("fr-FR")}`); nl();
  if (inv.due_date) { t(`Échéance : ${new Date(inv.due_date).toLocaleDateString("fr-FR")}`); nl(); }
  nl(15);
  t("Facturé à :", 50, true); nl();
  t(inv.billing_entity_name || proposal?.client_name || ""); nl();
  for (const line of String(inv.billing_entity_address || "").split(/\n/)) { if (line.trim()) { t(line); nl(); } }
  if (inv.billing_entity_siret) { t(`SIRET : ${inv.billing_entity_siret}`); nl(); }
  if (inv.billing_entity_vat) { t(`TVA : ${inv.billing_entity_vat}`); nl(); }
  nl(25);
  const ht = Number(inv.amount_ht || 0), ttc = Number(inv.amount_ttc || 0), rate = Number(inv.tva_rate || 0);
  t("Désignation", 50, true); t("Montant HT", 450, true); nl(18);
  t(`Prestation conférence - ${proposal?.client_name || ""}`.slice(0, 80)); t(eur(ht), 450); nl(30);
  t("Total HT", 350, true); t(eur(ht), 450); nl();
  t(`TVA ${rate} %`, 350); t(eur(ttc - ht), 450); nl();
  t("Total TTC", 350, true); t(eur(ttc), 450, true); nl(40);
  t("Règlement par virement - SWAN SAS", 50, true); nl();
  t("IBAN : FR76 1732 8844 0034 5146 9068 617 - BIC : SWNBFR22"); nl();
  return await doc.saveAsBase64();
}

async function sendToPennylane(adminClient: any, key: string, invoice: any, proposal: any, pdfIn?: string): Promise<boolean> {
  let pdf = typeof pdfIn === "string" && pdfIn.length > 1000 ? pdfIn : "";
  console.log("[pennylane] invoice", invoice.invoice_number, "pdf from screen:", !!pdf);
  try {
    if (!pdf) { pdf = await buildInvoicePdf(invoice, proposal); console.log("[pennylane] fallback pdf generated, len", pdf.length); }
    const safeNum = String(invoice.invoice_number || "facture").replace(/[^\w.-]+/g, "_");
    const pr = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: [PENNYLANE_EMAIL],
        subject: `Facture ${invoice.invoice_number} - ${proposal?.client_name || ""}`,
        html: `<p>Facture ${invoice.invoice_number} - ${proposal?.client_name || ""} en pièce jointe.</p>`,
        attachments: [{ filename: `Facture-${safeNum}.pdf`, content: pdf }],
      }),
    });
    const pt = await pr.text();
    console.log("[pennylane] resend status", pr.status, pt);
    if (!pr.ok) throw new Error(`Resend ${pr.status}: ${pt}`.slice(0, 500));
    await adminClient.from("invoices").update({ pennylane_sent_at: new Date().toISOString(), pennylane_error: null }).eq("id", invoice.id);
    return true;
  } catch (e) {
    console.error("[pennylane] error", e);
    await adminClient.from("invoices").update({ pennylane_error: String((e as any)?.message || e).slice(0, 500) }).eq("id", invoice.id);
    return false;
  }
}

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
    const { action, invoice_id, email_subject, email_body, to, cc, pdf_base64 } = payload;

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
    if (action === "pennylane_only") {
      const ok = await sendToPennylane(adminClient, RESEND_API_KEY, invoice, proposal, pdf_base64);
      return json({ success: ok, pennylane_sent: ok });
    }
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

    const pennylane_sent = await sendToPennylane(adminClient, RESEND_API_KEY, invoice, proposal, pdf_base64);

    return json({ success: true, resend_id: resendId, to: recipientEmail, cc: ccList, pennylane_sent });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
