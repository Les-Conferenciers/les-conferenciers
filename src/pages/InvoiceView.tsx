import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type InvoiceData = {
  id: string;
  invoice_number: string;
  invoice_type: string;
  amount_ht: number;
  tva_rate: number;
  amount_ttc: number;
  status: string;
  due_date: string | null;
  created_at: string;
  proposal: {
    client_name: string;
    client_email: string;
    recipient_name: string | null;
    proposal_speakers: {
      speaker_fee: number | null;
      travel_costs: number | null;
      agency_commission: number | null;
      total_price: number | null;
      speakers: { name: string } | null;
    }[];
  };
};

const InvoiceView = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("invoices")
        .select(`
          *,
          proposal:proposals(
            client_name, client_email, recipient_name,
            proposal_speakers(speaker_fee, travel_costs, agency_commission, total_price, speakers(name))
          )
        `)
        .eq("id", id!)
        .single();
      setInvoice(data as any);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen">Facture introuvable</div>;

  const proposal = invoice.proposal as any;
  const speakers = proposal?.proposal_speakers || [];

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const typeLabel = invoice.invoice_type === "acompte"
    ? "FACTURE D'ACOMPTE"
    : invoice.invoice_type === "solde"
    ? "FACTURE DE SOLDE"
    : "FACTURE";

  const statusLabel = invoice.status === "paid" ? "PAYÉE" : invoice.status === "sent" ? "EN ATTENTE" : "BROUILLON";
  const statusColor = invoice.status === "paid" ? "text-green-600 bg-green-50" : invoice.status === "sent" ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-50";

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto p-8 print:p-0 text-[13px] leading-relaxed text-gray-900">
        {/* Header */}
        <div className="flex justify-between items-start mb-10 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{COMPANY.tradeName}</h1>
            <p className="text-sm text-gray-500">{COMPANY.legalForm}</p>
            <p className="text-sm text-gray-500 mt-1">{COMPANY.fullAddress}</p>
            <p className="text-sm text-gray-500">SIRET : {COMPANY.siret}</p>
            <p className="text-sm text-gray-500">TVA : {COMPANY.tvaIntra}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">{typeLabel}</p>
            <p className="text-sm font-semibold mt-1">{invoice.invoice_number}</p>
            <p className="text-sm text-gray-500">
              Date : {formatDate(invoice.created_at)}
            </p>
            {invoice.due_date && (
              <p className="text-sm text-gray-500">Échéance : {formatDate(invoice.due_date)}</p>
            )}
            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Client */}
        <section className="mb-8">
          <div className="bg-gray-50 p-4 rounded-lg inline-block min-w-[300px]">
            <p className="font-semibold mb-1 text-gray-600 text-xs uppercase tracking-wide">Facturé à</p>
            <p className="font-medium text-base">{proposal?.client_name}</p>
            {proposal?.recipient_name && <p>{proposal.recipient_name}</p>}
            <p className="text-gray-500">{proposal?.client_email}</p>
          </div>
        </section>

        {/* Line items */}
        <section className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-2 px-3 font-semibold">Désignation</th>
                <th className="text-right py-2 px-3 font-semibold">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {speakers.map((s: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="py-2 px-3">
                    <p className="font-medium">Prestation de conférence — {s.speakers?.name || "Conférencier"}</p>
                    <p className="text-xs text-gray-500">
                      Cachet : {(s.speaker_fee || 0).toLocaleString("fr-FR")} € · 
                      Déplacement : {(s.travel_costs || 0).toLocaleString("fr-FR")} € · 
                      Commission : {(s.agency_commission || 0).toLocaleString("fr-FR")} €
                    </p>
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{(s.total_price || 0).toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">{invoice.amount_ht.toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-gray-600">TVA {invoice.tva_rate}%</span>
                <span>{(invoice.amount_ttc - invoice.amount_ht).toLocaleString("fr-FR")} €</span>
              </div>
              {invoice.invoice_type !== "total" && (
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-gray-600 italic">
                    {invoice.invoice_type === "acompte" ? "Acompte 50%" : "Solde 50%"}
                  </span>
                  <span />
                </div>
              )}
              <div className="flex justify-between py-2 bg-gray-900 text-white px-3 rounded-b-lg -mx-0">
                <span className="font-bold">Total TTC</span>
                <span className="font-bold">{invoice.amount_ttc.toLocaleString("fr-FR")} €</span>
              </div>
            </div>
          </div>
        </section>

        {/* Payment info */}
        <section className="mb-8">
          <h2 className="text-sm font-bold mb-2 text-gray-900 uppercase tracking-wide">Modalités de règlement</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-2">Paiement par virement bancaire :</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Titulaire :</span> {COMPANY.name}
              </div>
              <div>
                <span className="text-gray-500">IBAN :</span> {COMPANY.iban}
              </div>
              <div>
                <span className="text-gray-500">BIC :</span> {COMPANY.bic}
              </div>
              <div>
                <span className="text-gray-500">Référence :</span> {invoice.invoice_number}
              </div>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section className="text-[10px] text-gray-400 mt-8">
          <p>En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (Art. L441-10 du Code de commerce).</p>
          <p className="mt-1">TVA non applicable, art. 293 B du CGI — ou TVA {invoice.tva_rate}% selon le régime applicable.</p>
        </section>

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t text-center text-[10px] text-gray-400">
          {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret} — TVA : {COMPANY.tvaIntra}
        </footer>
      </div>
    </div>
  );
};

export default InvoiceView;
