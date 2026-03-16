import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPANY_BANK = {
  iban: "FR76 XXXX XXXX XXXX XXXX XXXX XXX",
  bic: "XXXXXXXX",
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

    const { invoice_id, email_subject, email_body } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: invoice, error: iErr } = await adminClient
      .from("invoices")
      .select("*, proposal:proposals(client_name, client_email, recipient_name)")
      .eq("id", invoice_id)
      .single();

    if (iErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: corsHeaders });
    }

    const proposal = invoice.proposal;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500, headers: corsHeaders });
    }

    const invoiceUrl = `https://les-conferenciers.netlify.app/admin/facture/${invoice.id}`;
    const bodyHtml = (email_body || `Bonjour,\n\nVeuillez trouver votre facture ${invoice.invoice_number}.\n\nCordialement,\nLes Conférenciers`).replace(/\n/g, "<br>");
    const subject = email_subject || `Facture ${invoice.invoice_number} — ${proposal.client_name}`;

    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px;background:#1a2332;border-radius:12px 12px 0 0;">
      <h1 style="color:#f5f0e8;font-size:24px;margin:0;">Les Conférenciers</h1>
      <p style="color:#f5f0e8;opacity:0.7;font-size:14px;margin-top:8px;">Facture ${invoice.invoice_number}</p>
    </div>
    <div style="padding:30px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
      <div style="color:#333;font-size:15px;line-height:1.6;">${bodyHtml}</div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${invoiceUrl}" style="display:inline-block;background:#1a2332;color:#f5f0e8;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;">
          Consulter la facture
        </a>
      </div>
      <div style="background:#f8f6f1;padding:16px;border-radius:8px;margin:20px 0;">
        <p style="color:#333;font-size:13px;margin:0 0 4px;font-weight:bold;">Coordonnées bancaires :</p>
        <p style="color:#555;font-size:13px;margin:0;">IBAN : ${COMPANY_BANK.iban}</p>
        <p style="color:#555;font-size:13px;margin:0;">BIC : ${COMPANY_BANK.bic}</p>
      </div>
      <p style="color:#999;font-size:11px;text-align:center;margin-top:20px;">Document confidentiel — Les Conférenciers</p>
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Les Conférenciers <nellysabde@lesconferenciers.com>",
        to: [proposal.client_email],
        subject,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), { status: 500, headers: corsHeaders });
    }

    await adminClient.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});