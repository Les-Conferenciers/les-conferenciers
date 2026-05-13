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
  vhr_estimate: number | null;
  contract_id: string | null;
  proposal_id: string;
};

const InvoiceView = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [speaker, setSpeaker] = useState<any>(null);
  const [bdcNumber, setBdcNumber] = useState("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (!inv) { setLoading(false); return; }
      setInvoice(inv as any);

      const [propRes, contractRes, eventRes, bdcRes] = await Promise.all([
        supabase.from("proposals").select("*, proposal_speakers(speaker_fee, travel_costs, agency_commission, total_price, speakers(id, name))").eq("id", (inv as any).proposal_id).maybeSingle(),
        (inv as any).contract_id
          ? supabase.from("contracts").select("*").eq("id", (inv as any).contract_id).maybeSingle()
          : supabase.from("contracts").select("*").eq("proposal_id", (inv as any).proposal_id).maybeSingle(),
        supabase.from("events").select("*").eq("proposal_id", (inv as any).proposal_id).maybeSingle(),
        (supabase as any).rpc("get_invoice_bdc", { _invoice_id: (inv as any).id }),
      ]);
      setProposal(propRes.data);
      setContract(contractRes.data);
      setEvent(eventRes.data);
      setBdcNumber((eventRes.data as any)?.bdc_number || (bdcRes.data as string | null) || "—");

      const clientId = (propRes.data as any)?.client_id;
      if (clientId) {
        const { data: c } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
        setClient(c);
      }

      const speakerId = (eventRes.data as any)?.selected_speaker_id || (contractRes.data as any)?.selected_speaker_id;
      const ps = (propRes.data as any)?.proposal_speakers || [];
      const matched = speakerId ? ps.find((p: any) => p.speakers?.id === speakerId) : ps[0];
      setSpeaker(matched);

      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!invoice) return <div className="flex items-center justify-center min-h-screen">Facture introuvable</div>;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const typeLabel = invoice.invoice_type === "acompte"
    ? "FACTURE D'ACOMPTE"
    : invoice.invoice_type === "solde"
    ? "FACTURE DE SOLDE"
    : "FACTURE";

  const statusLabel = invoice.status === "paid" ? "PAYÉE" : invoice.status === "sent" ? "EN ATTENTE" : "BROUILLON";
  const statusColor = invoice.status === "paid" ? "text-green-600 bg-green-50" : invoice.status === "sent" ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-50";

  const speakerName = speaker?.speakers?.name || "—";
  const eventDate = contract?.event_date || event?.event_date;
  const eventLocation = contract?.event_location || "—";
  const eventTime = contract?.event_time || "—";
  // Single designation line: prestation totale (cachet + commission + déplacement fusionnés)
  const totalPrestationHT = invoice.amount_ht; // already prorated for the invoice (acompte/solde/total)
  const vhr = invoice.vhr_estimate || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      <div className="max-w-[820px] mx-auto p-8 print:p-6 text-[13px] leading-relaxed text-gray-900">
        {/* Header avec logo */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
          <div className="flex-1">
            <img src="/images/les-conferenciers-banniere.png" alt="Les Conférenciers" className="h-14 w-auto mb-3" />
            <p className="text-xs text-gray-600 leading-snug">
              {COMPANY.tradeName}<br />
              {COMPANY.legalForm} – {COMPANY.fullAddress}<br />
              SIRET : {COMPANY.siret} – TVA : {COMPANY.tvaIntra}
            </p>
          </div>
          <div className="text-right ml-6">
            <p className="text-xl font-bold text-gray-900">{typeLabel}</p>
            <p className="text-sm font-semibold mt-1">N° {invoice.invoice_number}</p>
            <p className="text-xs text-gray-500 mt-1">Émise le : {formatDate(invoice.created_at)}</p>
            {invoice.due_date && (
              <p className="text-xs text-gray-500">Échéance : {formatDate(invoice.due_date)}</p>
            )}
            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Client (sans label "Facturé à") */}
        <section className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-md">
            <p className="font-semibold text-base text-gray-900">{client?.company_name || proposal?.client_name}</p>
            {client?.contact_name && <p className="text-gray-700">{client.contact_name}</p>}
            {(client?.address || client?.city) && (
              <p className="text-gray-700 mt-1">
                {client?.address}{client?.address && client?.city ? ", " : ""}{client?.city}
              </p>
            )}
            {client?.siret && <p className="text-gray-600 text-xs mt-1">RCS / SIRET : {client.siret}</p>}
          </div>
        </section>

        {/* Mention BDC à rappeler */}
        <section className="mb-6">
          <div className="border-l-4 border-gray-900 bg-gray-100 px-4 py-3">
            <p className="font-bold text-gray-900 text-sm">
              Mention à rappeler impérativement : Bon de commande n° {bdcNumber}
            </p>
          </div>
        </section>

        {/* Détails de l'intervention */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Intervention</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="text-gray-500">Conférencier :</span> <span className="font-medium">{speakerName}</span></div>
            <div><span className="text-gray-500">Date :</span> <span className="font-medium">{formatDate(eventDate)}</span></div>
            <div><span className="text-gray-500">Lieu :</span> <span className="font-medium">{eventLocation}</span></div>
            <div><span className="text-gray-500">Horaires :</span> <span className="font-medium">{eventTime}</span></div>
          </div>
        </section>

        {/* Lignes facture */}
        <section className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide">Désignation</th>
                <th className="text-right py-2 px-3 font-semibold text-xs uppercase tracking-wide w-32">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-3 px-3">
                  <p className="font-medium">Prestation de conférence — {speakerName}</p>
                  {invoice.invoice_type !== "total" && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {invoice.invoice_type === "acompte" ? "Acompte 50%" : "Solde 50%"}
                    </p>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-medium">{totalPrestationHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
              </tr>
              {vhr > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-3">
                    <p className="font-medium">Estimation frais VHR</p>
                    <p className="text-xs text-gray-500 mt-0.5">Voyage / Hébergement / Restauration — refacturés au réel sur justificatifs</p>
                  </td>
                  <td className="py-3 px-3 text-right font-medium">{vhr.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">{(invoice.amount_ht + vhr).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-gray-600">TVA {invoice.tva_rate}%</span>
                <span>{((invoice.amount_ht + vhr) * invoice.tva_rate / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between py-3 bg-gray-900 text-white px-3 mt-1 rounded">
                <span className="font-bold">Total TTC</span>
                <span className="font-bold">{((invoice.amount_ht + vhr) * (1 + invoice.tva_rate / 100)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>
          </div>
        </section>

        {/* Modalités de règlement (RIB) */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Modalités de règlement</h2>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm mb-2">Paiement par virement bancaire — référence à rappeler : <strong>BDC n° {bdcNumber}</strong></p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div><span className="text-gray-500">Titulaire :</span> {COMPANY.name}</div>
              <div><span className="text-gray-500">BIC :</span> {COMPANY.bic}</div>
              <div className="col-span-2"><span className="text-gray-500">IBAN :</span> <span className="font-mono">{COMPANY.iban}</span></div>
            </div>
          </div>
        </section>

        {/* Légales */}
        <section className="text-[10px] text-gray-500 mt-6 leading-relaxed">
          <p>En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (Art. L441-10 du Code de commerce).</p>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t text-center text-[10px] text-gray-400">
          {COMPANY.tradeName} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret} — TVA : {COMPANY.tvaIntra}
        </footer>
      </div>
    </div>
  );
};

export default InvoiceView;
