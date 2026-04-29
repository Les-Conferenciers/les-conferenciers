import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type ContractLine = {
  id: string;
  label: string;
  amount_ht: number;
  tva_rate: number;
  type: string;
};

type ContractData = {
  id: string;
  token: string;
  proposal_id: string;
  event_date: string | null;
  event_location: string | null;
  event_time: string | null;
  event_format: string | null;
  event_description: string | null;
  status: string;
  signer_name: string | null;
  signed_at: string | null;
  created_at: string;
  contract_lines: ContractLine[] | null;
  discount_percent: number | null;
  proposal: {
    client_name: string;
    client_email: string;
    recipient_name: string | null;
    client_id: string | null;
    proposal_speakers: {
      speaker_fee: number | null;
      total_price: number | null;
      speakers: { name: string; gender: string | null } | null;
    }[];
  };
};

const ContractSign = () => {
  const { token } = useParams();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [client, setClient] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("contracts")
        .select(`*, proposal:proposals(client_name, client_email, recipient_name, client_id, proposal_speakers(speaker_fee, total_price, speakers(name, gender)))`)
        .eq("token", token!)
        .single();
      const c = data as any;
      setContract(c);
      if (c?.status === "signed") {
        setSigned(true);
        if (c.signer_name) setSignerName(c.signer_name);
      }

      if (c?.proposal?.client_id) {
        const { data: cl } = await supabase.from("clients").select("company_name, contact_name, address, city, siret").eq("id", c.proposal.client_id).single();
        setClient(cl);
      }
      const { data: ev } = await supabase.from("events").select("bdc_number, audience_size, theme").eq("proposal_id", c?.proposal_id).maybeSingle();
      setEvent(ev);

      setLoading(false);
    };
    fetchAll();
  }, [token]);

  const generateAndUploadPdf = async (contractId: string, contractToken: string) => {
    if (!printRef.current) return;
    try {
      // Wait a tick for DOM to settle (signature block visible)
      await new Promise((r) => setTimeout(r, 300));
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      // Convert to base64 (without data: prefix)
      const dataUri = pdf.output("datauristring");
      const base64 = dataUri.split(",")[1];
      const fileName = `Contrat-signe-${contractId.slice(0, 8)}.pdf`;

      const { error } = await supabase.functions.invoke("upload-signed-contract", {
        body: { token: contractToken, pdf_base64: base64, file_name: fileName },
      });
      if (error) console.error("upload-signed-contract error", error);
    } catch (e) {
      console.error("PDF gen failed", e);
    }
  };

  const handleSign = async () => {
    if (!contract || !signerName.trim() || !accepted) return;
    setSigning(true);
    const { error } = await supabase.from("contracts").update({
      status: "signed", signer_name: signerName.trim(), signer_ip: "client", signed_at: new Date().toISOString(),
    } as any).eq("token", token!);
    if (error) { toast.error("Erreur lors de la signature"); setSigning(false); return; }
    setSigned(true);
    toast.success("Contrat signé avec succès !");
    // Génère le PDF après mise à jour de l'UI (la signature manuscrite doit apparaître)
    setTimeout(() => { generateAndUploadPdf(contract.id, contract.token); }, 600);
    setSigning(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement…</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Contrat introuvable ou lien invalide.</div>;

  const proposal = contract.proposal as any;
  const speakers = proposal?.proposal_speakers || [];
  const firstSpeaker = speakers[0]?.speakers;
  const speakerGender = firstSpeaker?.gender === "female" ? "Madame" : "Monsieur";

  const lines: ContractLine[] = (contract.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0)
    ? contract.contract_lines
    : speakers.map((s: any, i: number) => ({ id: String(i), label: s.speakers?.name || `Conférencier ${i + 1}`, amount_ht: s.total_price || 0, tva_rate: 20, type: "speaker" }));

  const discount = contract.discount_percent || 0;
  const subtotalHT = lines.reduce((sum, l) => sum + l.amount_ht, 0);
  const discountAmount = subtotalHT * (discount / 100);
  const totalHT = subtotalHT - discountAmount;
  const totalTVA = lines.reduce((sum, l) => {
    const share = subtotalHT > 0 ? l.amount_ht / subtotalHT : 0;
    return sum + (l.amount_ht - discountAmount * share) * (l.tva_rate / 100);
  }, 0);
  const totalTTC = totalHT + totalTVA;

  const formatDateLong = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "À définir";
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  const bdcNumber = event?.bdc_number || contract.id.slice(0, 4).toUpperCase();
  const clientName = client?.company_name || proposal?.client_name || "";

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="max-w-[800px] mx-auto p-6 md:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold text-[#1a2332]">Les Conférenciers</h1>
          <p className="text-sm text-[#1a2332]/60 mt-1">Bon de commande</p>
        </div>

        <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1a2332] px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              <h2 className="font-semibold">BON DE COMMANDE — CONDITIONS PARTICULIÈRES</h2>
            </div>
            <p className="text-white/60 text-sm mt-1">N° {bdcNumber} — Émis le {formatDate(contract.created_at)}</p>
          </div>

          <div className="p-6 space-y-6 text-[13px] text-gray-700">
            {/* ENTRE */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">ENTRE</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <p className="font-bold">{clientName}</p>
                  {client?.address && <p>{client.address} {client.city}</p>}
                  {client?.siret && <p>{client.siret}</p>}
                  <p className="text-sm italic text-gray-500 mt-2">(ci-après le « Client »)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <p className="font-bold">Les Conférenciers</p>
                  <p>Société Eve</p>
                  <p className="text-sm">N° SIREN : {COMPANY.siret}</p>
                  <p className="text-sm">{COMPANY.fullAddress}</p>
                  <p className="text-sm italic text-gray-500 mt-2">(ci-après « Les conférenciers »)</p>
                </div>
              </div>
            </div>

            {/* Intervenant */}
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Intervenant</h3>
              <p>{speakerGender} {firstSpeaker?.name || "—"}</p>
              <p className="text-sm italic text-gray-500">ci-après l'« Intervenant »</p>
            </div>

            {/* Événement */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Détails de l'événement</h3>
              <div className="space-y-1">
                <p><span className="text-gray-500">Date :</span> {formatDateLong(contract.event_date)}</p>
                <p><span className="text-gray-500">Lieu :</span> {contract.event_location || "À définir"}</p>
                <p><span className="text-gray-500">Horaires :</span> {contract.event_time || "À définir"}</p>
                {event?.audience_size && <p><span className="text-gray-500">Auditoire :</span> {event.audience_size}</p>}
                {event?.theme && <p><span className="text-gray-500">Thématique :</span> {event.theme}</p>}
                {contract.event_format && <p><span className="text-gray-500">Format :</span> {contract.event_format}</p>}
                {contract.event_description && <p className="whitespace-pre-line"><span className="text-gray-500">Détails :</span> {contract.event_description}</p>}
              </div>
            </div>

            {/* Montant */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Montant de la prestation</h3>
              {lines.map((line, i) => (
                <p key={i}>
                  {line.type === "speaker" ? "Montant de la prestation de l'intervenant" : line.label} : {(line.amount_ht * (1 + line.tva_rate / 100)).toLocaleString("fr-FR")} €TTC, soit {line.amount_ht.toLocaleString("fr-FR")} €HT{line.type === "speaker" ? ", hors frais de déplacements" : ""}
                </p>
              ))}
              {discount > 0 && <p className="text-sm text-gray-500">Remise de {discount}% appliquée</p>}
              <p className="mt-1">TVA Les conférenciers : FR - TVA applicable : 20%</p>
            </div>

            <p className="text-sm text-gray-500">
              Les conditions générales applicables au Bon de commande sont transmises au Client et à l'Intervenant simultanément à la remise du Bon de commande.
            </p>

            {/* CGV condensées */}
            <details className="text-xs text-gray-600">
              <summary className="font-bold text-gray-900 cursor-pointer hover:text-gray-700 py-2">
                📄 Voir les conditions générales (Articles 1-11)
              </summary>
              <div className="space-y-4 mt-3 pl-2 border-l-2 border-gray-200">
                <div><h4 className="font-semibold">Article 1. Définitions</h4><p>Bon de commande, Client, Conditions générales, Contrat, Informations confidentielles, Intervenant, Événement, Image de l'Intervenant, Parties, Prestation : termes définis au contrat.</p></div>
                <div><h4 className="font-semibold">Article 2. Objet et composition du Contrat</h4><p>Définit les Prestations et les modalités d'utilisation de l'image de l'Intervenant.</p></div>
                <div><h4 className="font-semibold">Article 3. Réalisation des Prestations</h4><p>Accompagnement, participation de l'Intervenant, engagements du Client, relations entre les Parties (rendez-vous tripartite, loyauté, confidentialité, exclusivité 3 ans).</p></div>
                <div><h4 className="font-semibold">Article 4. Droit à l'image et droit d'auteur</h4><p>Règles avant, pendant et après l'événement. Captation soumise à accord écrit.</p></div>
                <div><h4 className="font-semibold">Article 5. Modalités financières</h4><p>50% à la signature, 100% reçu 7 jours avant l'événement. Frais de déplacement facturés sur justificatif.</p></div>
                <div><h4 className="font-semibold">Article 6. Durée du Contrat</h4><p>Entrée en vigueur à la signature, valable jusqu'à extinction des obligations.</p></div>
                <div><h4 className="font-semibold">Article 7. Modification des Prestations</h4><p>Annulation par le Client : 50% à +30j, 100% à -30j. Résiliation après mise en demeure de 30 jours.</p></div>
                <div><h4 className="font-semibold">Article 8. Force majeure</h4><p>Exonération en cas d'événement imprévisible et irrésistible.</p></div>
                <div><h4 className="font-semibold">Article 9. Imprévision</h4><p>Renégociation possible si variation de +30% du prix.</p></div>
                <div><h4 className="font-semibold">Article 10. Obligations légales</h4><p>Responsabilités administratives, données personnelles, recours à un tiers.</p></div>
                <div><h4 className="font-semibold">Article 11. Divers</h4><p>Signature électronique reconnue. Loi française applicable. Tribunal de Paris compétent.</p></div>
              </div>
            </details>
          </div>

          {/* Signature section */}
          <div className="border-t border-gray-200 p-6">
            {signed ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full text-sm font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Contrat signé{contract.signer_name ? ` par ${contract.signer_name}` : ""}
                    {contract.signed_at ? ` le ${formatDateLong(contract.signed_at)}` : ""}
                  </div>
                </div>
                {/* Bloc signature manuscrite (utilisé pour la génération PDF) */}
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50/50 min-h-[140px]">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Le Client</p>
                    <p className="text-[11px] text-gray-500 mb-2">{clientName}</p>
                    <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] leading-tight">
                      Bon pour accord
                    </p>
                    <p style={{ fontFamily: "'Caveat', cursive" }} className="text-3xl text-[#1a2332] mt-1">
                      {contract.signer_name || signerName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Signé électroniquement le {contract.signed_at ? formatDateLong(contract.signed_at) : formatDateLong(new Date().toISOString())}
                    </p>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50/50 min-h-[140px]">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Les Conférenciers</p>
                    <p className="text-[11px] text-gray-500 mb-2">Société Eve</p>
                    <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] leading-tight">
                      Bon pour accord
                    </p>
                    <p style={{ fontFamily: "'Caveat', cursive" }} className="text-3xl text-[#1a2332] mt-1">
                      Nelly Sabde
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Vous recevrez une confirmation par email avec le contrat signé en pièce jointe.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-center text-lg">Signer le bon de commande</h3>
                <p className="text-sm text-gray-500 text-center">
                  En signant ce bon de commande, vous acceptez l'ensemble des conditions décrites ci-dessus.
                </p>
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Label>Votre nom complet (signature)</Label>
                    <Input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Prénom NOM" className="text-center text-lg font-serif" />
                    {signerName && (
                      <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] text-center mt-2">
                        Bon pour accord — {signerName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                    <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
                    <label htmlFor="accept" className="text-sm leading-relaxed cursor-pointer">
                      Je soussigné(e) <strong>{signerName || "___"}</strong>, représentant la société <strong>{clientName}</strong>,
                      déclare avoir pris connaissance des conditions ci-dessus et les accepte sans réserve.
                      <br /><span className="text-xs text-gray-500">La mention « Bon pour accord » sera apposée automatiquement.</span>
                    </label>
                  </div>
                  <Button className="w-full py-6 text-base" onClick={handleSign} disabled={signing || !signerName.trim() || !accepted}>
                    {signing ? "Signature en cours…" : "✍️ Je signe le bon de commande"}
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center">
                    La date et l'heure de signature seront enregistrées. Ce document a valeur d'engagement contractuel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-6 text-center text-[10px] text-gray-400">
          {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret}
        </footer>
      </div>
    </div>
  );
};

export default ContractSign;
