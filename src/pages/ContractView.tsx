import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type ContractData = {
  id: string;
  event_date: string | null;
  event_location: string | null;
  event_time: string | null;
  event_format: string | null;
  event_description: string | null;
  status: string;
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

const ContractView = () => {
  const { id } = useParams();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("contracts")
        .select(`
          *,
          proposal:proposals(
            client_name, client_email, recipient_name,
            proposal_speakers(speaker_fee, travel_costs, agency_commission, total_price, speakers(name))
          )
        `)
        .eq("id", id!)
        .single();
      setContract(data as any);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen">Contrat introuvable</div>;

  const proposal = contract.proposal as any;
  const speakers = proposal?.proposal_speakers || [];
  const totalHT = speakers.reduce((sum: number, s: any) => sum + (s.total_price || 0), 0);
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;
  const acompte = totalTTC * (COMPANY.paymentTerms.deposit / 100);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "À définir";

  return (
    <div className="min-h-screen bg-white">
      {/* Print button - hidden when printing */}
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
            <p className="text-xl font-bold text-gray-900">CONTRAT DE PRESTATION</p>
            <p className="text-sm text-gray-500 mt-1">
              Réf. : CTR-{contract.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500">
              Date : {new Date(contract.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        {/* Parties */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-900">ENTRE LES SOUSSIGNÉS</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-1">Le prestataire :</p>
              <p>{COMPANY.name} ({COMPANY.tradeName})</p>
              <p>{COMPANY.fullAddress}</p>
              <p>SIRET : {COMPANY.siret}</p>
              <p>Ci-après dénommé « le Prestataire »</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-1">Le client :</p>
              <p className="font-medium">{proposal?.client_name}</p>
              {proposal?.recipient_name && <p>À l'attention de : {proposal.recipient_name}</p>}
              <p>{proposal?.client_email}</p>
              <p>Ci-après dénommé « le Client »</p>
            </div>
          </div>
        </section>

        {/* Event details */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-900">ARTICLE 1 — OBJET DE LA PRESTATION</h2>
          <p className="mb-3">
            Le Prestataire s'engage à organiser et fournir une prestation de conférence selon les modalités suivantes :
          </p>
          <table className="w-full border-collapse mb-3">
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-gray-600 w-40">Date</td>
                <td className="py-2">{formatDate(contract.event_date)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-gray-600">Lieu</td>
                <td className="py-2">{contract.event_location || "À définir"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-gray-600">Horaires</td>
                <td className="py-2">{contract.event_time || "À définir"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-gray-600">Format</td>
                <td className="py-2">{contract.event_format || "Conférence"}</td>
              </tr>
            </tbody>
          </table>
          {contract.event_description && (
            <p className="text-sm text-gray-600 italic">{contract.event_description}</p>
          )}
        </section>

        {/* Speakers & pricing */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-900">ARTICLE 2 — CONFÉRENCIER(S) ET TARIFICATION</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-2 px-3 font-semibold">Conférencier</th>
                <th className="text-right py-2 px-3 font-semibold">Cachet</th>
                <th className="text-right py-2 px-3 font-semibold">Déplacement</th>
                <th className="text-right py-2 px-3 font-semibold">Commission</th>
                <th className="text-right py-2 px-3 font-semibold">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {speakers.map((s: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="py-2 px-3">{s.speakers?.name || "—"}</td>
                  <td className="py-2 px-3 text-right">{(s.speaker_fee || 0).toLocaleString("fr-FR")} €</td>
                  <td className="py-2 px-3 text-right">{(s.travel_costs || 0).toLocaleString("fr-FR")} €</td>
                  <td className="py-2 px-3 text-right">{(s.agency_commission || 0).toLocaleString("fr-FR")} €</td>
                  <td className="py-2 px-3 text-right font-medium">{(s.total_price || 0).toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={4} className="py-2 px-3 text-right font-semibold">Total HT</td>
                <td className="py-2 px-3 text-right font-bold">{totalHT.toLocaleString("fr-FR")} €</td>
              </tr>
              <tr>
                <td colSpan={4} className="py-1 px-3 text-right text-gray-500">TVA 20%</td>
                <td className="py-1 px-3 text-right text-gray-500">{tva.toLocaleString("fr-FR")} €</td>
              </tr>
              <tr className="bg-gray-900 text-white">
                <td colSpan={4} className="py-2 px-3 text-right font-bold">Total TTC</td>
                <td className="py-2 px-3 text-right font-bold">{totalTTC.toLocaleString("fr-FR")} €</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Payment terms */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-900">ARTICLE 3 — CONDITIONS DE PAIEMENT</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acompte de {COMPANY.paymentTerms.deposit}% ({acompte.toLocaleString("fr-FR")} € TTC) à la signature du présent contrat.</li>
            <li>Solde de {100 - COMPANY.paymentTerms.deposit}% ({(totalTTC - acompte).toLocaleString("fr-FR")} € TTC) exigible {COMPANY.paymentTerms.balanceDaysBefore} jours avant la date de l'événement.</li>
          </ul>
          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Coordonnées bancaires :</p>
            <p>IBAN : {COMPANY.iban}</p>
            <p>BIC : {COMPANY.bic}</p>
          </div>
        </section>

        {/* CGV */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-gray-900">ARTICLE 4 — CONDITIONS GÉNÉRALES</h2>
          <ol className="list-decimal pl-5 space-y-1.5">
            {COMPANY.cgv.map((clause, i) => (
              <li key={i}>{clause}</li>
            ))}
          </ol>
        </section>

        {/* Signatures */}
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-6 text-gray-900">SIGNATURES</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="border rounded-lg p-6 min-h-[150px]">
              <p className="font-semibold mb-1">Le Prestataire</p>
              <p className="text-sm text-gray-500">{COMPANY.tradeName}</p>
              <p className="text-sm text-gray-500 mt-2">Date :</p>
              <p className="text-sm text-gray-500 mt-1">Signature :</p>
            </div>
            <div className="border rounded-lg p-6 min-h-[150px]">
              <p className="font-semibold mb-1">Le Client</p>
              <p className="text-sm text-gray-500">{proposal?.client_name}</p>
              <p className="text-sm text-gray-500 mt-2">Date :</p>
              <p className="text-sm text-gray-500 mt-1">Signature précédée de la mention « Bon pour accord » :</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t text-center text-[10px] text-gray-400">
          {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret} — TVA : {COMPANY.tvaIntra}
        </footer>
      </div>
    </div>
  );
};

export default ContractView;
