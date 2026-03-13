import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";

type ContractData = {
  id: string;
  token: string;
  event_date: string | null;
  event_location: string | null;
  event_time: string | null;
  event_format: string | null;
  event_description: string | null;
  status: string;
  signer_name: string | null;
  signed_at: string | null;
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

const ContractSign = () => {
  const { token } = useParams();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

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
        .eq("token", token!)
        .single();
      const c = data as any;
      setContract(c);
      if (c?.status === "signed") setSigned(true);
      setLoading(false);
    };
    fetch();
  }, [token]);

  const handleSign = async () => {
    if (!contract || !signerName.trim() || !accepted) return;
    setSigning(true);

    const { error } = await supabase
      .from("contracts")
      .update({
        status: "signed",
        signer_name: signerName.trim(),
        signer_ip: "client", // actual IP would need server-side
        signed_at: new Date().toISOString(),
      } as any)
      .eq("token", token!);

    if (error) {
      toast.error("Erreur lors de la signature");
      console.error(error);
    } else {
      setSigned(true);
      toast.success("Contrat signé avec succès !");
    }
    setSigning(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement…</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Contrat introuvable ou lien invalide.</div>;

  const proposal = contract.proposal as any;
  const speakers = proposal?.proposal_speakers || [];
  const totalHT = speakers.reduce((sum: number, s: any) => sum + (s.total_price || 0), 0);
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;
  const acompte = totalTTC * (COMPANY.paymentTerms.deposit / 100);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "À définir";

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="max-w-[800px] mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-[#1a2332]">Les Conférenciers</h1>
          <p className="text-sm text-[#1a2332]/60 mt-1">Contrat de prestation</p>
        </div>

        {/* Contract content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header bar */}
          <div className="bg-[#1a2332] px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              <h2 className="font-semibold">Contrat de prestation</h2>
            </div>
            <p className="text-white/60 text-sm mt-1">Réf. CTR-{contract.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="p-6 space-y-6 text-[13px] text-gray-700">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">Le prestataire</p>
                <p>{COMPANY.tradeName}</p>
                <p>{COMPANY.fullAddress}</p>
                <p>SIRET : {COMPANY.siret}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">Le client</p>
                <p className="font-medium">{proposal?.client_name}</p>
                {proposal?.recipient_name && <p>Att. : {proposal.recipient_name}</p>}
              </div>
            </div>

            {/* Event */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Objet de la prestation</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex gap-2"><span className="text-gray-500">Date :</span><span>{formatDate(contract.event_date)}</span></div>
                <div className="flex gap-2"><span className="text-gray-500">Lieu :</span><span>{contract.event_location || "À définir"}</span></div>
                <div className="flex gap-2"><span className="text-gray-500">Horaires :</span><span>{contract.event_time || "À définir"}</span></div>
                <div className="flex gap-2"><span className="text-gray-500">Format :</span><span>{contract.event_format || "Conférence"}</span></div>
              </div>
            </div>

            {/* Speakers */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Conférencier(s) et tarification</h3>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-100 text-left"><th className="py-2 px-3">Conférencier</th><th className="py-2 px-3 text-right">Total HT</th></tr></thead>
                <tbody>
                  {speakers.map((s: any, i: number) => (
                    <tr key={i} className="border-b"><td className="py-2 px-3">{s.speakers?.name || "—"}</td><td className="py-2 px-3 text-right">{(s.total_price || 0).toLocaleString("fr-FR")} €</td></tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50"><td className="py-2 px-3 text-right font-semibold">Total HT</td><td className="py-2 px-3 text-right font-bold">{totalHT.toLocaleString("fr-FR")} €</td></tr>
                  <tr><td className="py-1 px-3 text-right text-gray-500">TVA 20%</td><td className="py-1 px-3 text-right text-gray-500">{tva.toLocaleString("fr-FR")} €</td></tr>
                  <tr className="bg-[#1a2332] text-white"><td className="py-2 px-3 text-right font-bold">Total TTC</td><td className="py-2 px-3 text-right font-bold">{totalTTC.toLocaleString("fr-FR")} €</td></tr>
                </tfoot>
              </table>
            </div>

            {/* Payment */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Conditions de paiement</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Acompte de {COMPANY.paymentTerms.deposit}% ({acompte.toLocaleString("fr-FR")} € TTC) à la signature.</li>
                <li>Solde de {100 - COMPANY.paymentTerms.deposit}% ({(totalTTC - acompte).toLocaleString("fr-FR")} € TTC) {COMPANY.paymentTerms.balanceDaysBefore} jours avant l'événement.</li>
              </ul>
            </div>

            {/* CGV */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Conditions générales</h3>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600">
                {COMPANY.cgv.map((clause, i) => (
                  <li key={i}>{clause}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Signature section */}
          <div className="border-t border-gray-200 p-6">
            {signed ? (
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full text-sm font-medium">
                  <CheckCircle className="h-5 w-5" />
                  Contrat signé{contract.signer_name ? ` par ${contract.signer_name}` : ""}
                  {contract.signed_at ? ` le ${formatDate(contract.signed_at)}` : ""}
                </div>
                <p className="text-xs text-gray-500">Vous recevrez une confirmation par email.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-center text-lg">Signer le contrat</h3>
                <p className="text-sm text-gray-500 text-center">
                  En signant ce contrat, vous acceptez l'ensemble des conditions décrites ci-dessus.
                </p>
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Label>Votre nom complet (signature)</Label>
                    <Input
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      placeholder="Prénom NOM"
                      className="text-center text-lg font-serif"
                    />
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                    <Checkbox
                      id="accept"
                      checked={accepted}
                      onCheckedChange={(v) => setAccepted(v === true)}
                    />
                    <label htmlFor="accept" className="text-sm leading-relaxed cursor-pointer">
                      Je soussigné(e) <strong>{signerName || "___"}</strong>, représentant la société <strong>{proposal?.client_name}</strong>,
                      déclare avoir pris connaissance des conditions ci-dessus et les accepte sans réserve.
                      <br /><span className="text-xs text-gray-500">Mention « Bon pour accord »</span>
                    </label>
                  </div>
                  <Button
                    className="w-full py-6 text-base"
                    onClick={handleSign}
                    disabled={signing || !signerName.trim() || !accepted}
                  >
                    {signing ? "Signature en cours…" : "✍️ Je signe le contrat"}
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center">
                    La date et l'heure de signature seront enregistrées. Ce document a valeur d'engagement contractuel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-[10px] text-gray-400">
          {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret}
        </footer>
      </div>
    </div>
  );
};

export default ContractSign;