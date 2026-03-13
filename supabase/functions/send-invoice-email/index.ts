import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get invoice + proposal
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, proposal:proposals(client_name, client_email, recipient_name)")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) throw new Error("Invoice not found");

    const proposal = invoice.proposal as any;
    const typeLabel =
      invoice.invoice_type === "acompte"
        ? "Facture d'acompte"
        : invoice.invoice_type === "solde"
        ? "Facture de solde"
        : "Facture";

    // Determine the base URL (use origin header or fallback)
    const origin = req.headers.get("origin") || "https://lesconferenciers.com";
    const invoiceUrl = `${origin}/admin/facture/${invoice.id}`;

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 22px; color: #1a1a1a; margin-bottom: 8px;">
          ${typeLabel} — ${invoice.invoice_number}
        </h1>
        <p style="color: #666; margin-bottom: 24px;">
          ${proposal.recipient_name ? `Bonjour ${proposal.recipient_name},` : "Bonjour,"}
        </p>
        <p style="color: #333; line-height: 1.6;">
          Veuillez trouver ci-dessous votre ${typeLabel.toLowerCase()} n°${invoice.invoice_number}
          d'un montant de <strong>${invoice.amount_ttc.toLocaleString("fr-FR")} € TTC</strong>.
        </p>
        ${invoice.due_date ? `<p style="color: #333;">Échéance : <strong>${new Date(invoice.due_date).toLocaleDateString("fr-FR")}</strong></p>` : ""}
        <div style="margin: 24px 0;">
          <a href="${invoiceUrl}" 
             style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px;">
            Consulter la facture
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
          LES CONFERENCIERS — SAS EVE — 4 B Villa de la Gare, 92140 Clamart<br>
          SIRET : 848 829 743 00014 — contact@lesconferenciers.com
        </p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Les Conférenciers <contact@lesconferenciers.com>",
        to: [proposal.client_email],
        subject: `${typeLabel} ${invoice.invoice_number} — Les Conférenciers`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    // Also notify agency
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Les Conférenciers <contact@lesconferenciers.com>",
        to: ["nellysabde@lesconferenciers.com"],
        subject: `${typeLabel} ${invoice.invoice_number} envoyée à ${proposal.client_name}`,
        html: `<p>La ${typeLabel.toLowerCase()} <strong>${invoice.invoice_number}</strong> (${invoice.amount_ttc.toLocaleString("fr-FR")} € TTC) a été envoyée à <strong>${proposal.client_email}</strong>.</p>`,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
