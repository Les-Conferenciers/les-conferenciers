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
import { renderElementToPdfBase64 } from "@/lib/contractPdf";
import { ContractClauses } from "@/components/ContractClauses";
import { ContractParticulars } from "@/components/ContractParticulars";

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
  agency_commission?: number | null;
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

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const ContractSign = () => {
  const { token } = useParams();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [client, setClient] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [speaker, setSpeaker] = useState<{ name: string; gender: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("contracts")
        .select(`*, proposal:proposals(client_name, client_email, recipient_name, client_id, audience_size, proposal_speakers(speaker_id, speaker_fee, total_price, speakers(name, gender)))`)
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
      const { data: ev } = await supabase.from("events").select("bdc_number, audience_size, theme, selected_speaker_id").eq("proposal_id", c?.proposal_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setEvent(ev);
      const spId = c?.selected_speaker_id || (ev as any)?.selected_speaker_id;
      if (spId) {
        const { data: sp } = await supabase.from("speakers").select("name, gender").eq("id", spId).maybeSingle();
        if (sp) setSpeaker(sp as any);
      }


      setLoading(false);
    };
    fetchAll();
  }, [token]);

  const generateAndUploadPdf = async (contractId: string, contractToken: string, signedBy: string, signedAt: string, regenerate = false) => {
    try {
      const element = document.getElementById("contract-printable");
      if (!element) throw new Error("Contract DOM element not found");
      const base64 = await renderElementToPdfBase64(element);
      const fileName = `Contrat-signe-${contractId.slice(0, 8)}.pdf`;
      const { data, error } = await supabase.functions.invoke("upload-signed-contract", {
        body: { token: contractToken, pdf_base64: base64, file_name: fileName, signer_name: signedBy, signed_at: signedAt, regenerate },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return true;
    } catch (e) {
      console.error("PDF gen failed", e);
      return false;
    }
  };

  // Mode régénération (admin) : ?pdf=1 dans un iframe caché
  const regenMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("pdf") === "1";
  useEffect(() => {
    if (!regenMode || loading || !contract) return;
    (async () => {
      if (!contract.signed_at) { window.parent.postMessage({ type: "contract-pdf", ok: false, error: "not signed" }, "*"); return; }
      await (document as any).fonts?.ready;
      await new Promise((r) => setTimeout(r, 400));
      const ok = await generateAndUploadPdf(contract.id, contract.token, contract.signer_name || "", contract.signed_at, true);
      window.parent.postMessage({ type: "contract-pdf", ok }, "*");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenMode, loading, contract?.id]);

  const handleSign = async () => {
    if (!contract || !signerName.trim() || !accepted) return;
    setSigning(true);
    const signedAt = new Date().toISOString();
    const { error } = await supabase.from("contracts").update({
      signer_name: signerName.trim(), signer_ip: "client", signed_at: signedAt, client_signed_received_at: signedAt.slice(0, 10),
    } as any).eq("token", token!);
    if (error) { toast.error("Erreur lors de la signature"); setSigning(false); return; }
    setContract({ ...contract, signer_name: signerName.trim(), signed_at: signedAt } as ContractData);
    setSigned(true);
    // Wait for the signature block to appear in the DOM before capturing
    await new Promise((r) => setTimeout(r, 250));
    const uploaded = await generateAndUploadPdf(contract.id, contract.token, signerName.trim(), signedAt);
    toast.success(uploaded ? "Contrat signé et PDF archivé." : "Contrat signé, mais le PDF n'a pas pu être archivé automatiquement.");
    setSigning(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Chargement…</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Contrat introuvable ou lien invalide.</div>;

  const proposal = contract.proposal as any;
  const speakers = proposal?.proposal_speakers || [];
  const effectiveSpeakerId = (contract as any).selected_speaker_id || event?.selected_speaker_id;
  const resolvedSpeaker = speaker
    || (effectiveSpeakerId && speakers.find((s: any) => s.speakers && s.speaker_id === effectiveSpeakerId)?.speakers)
    || speakers[0]?.speakers || null;
  const clientName = client?.company_name || proposal?.client_name || "";
  const formatDateLong = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="max-w-[860px] mx-auto p-4 md:p-10">
        {/* Document identique à l'aperçu admin (ContractParticulars + ContractClauses) */}
        <div id="contract-printable" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <ContractParticulars contract={contract} client={client} event={event} speaker={resolvedSpeaker} />
          <div>
            <h1 className="text-xl font-bold text-center mb-8 uppercase text-gray-900" data-pdf-block>CONDITIONS GÉNÉRALES</h1>
            <ContractClauses customClauses={(contract as any).custom_clauses} depositRequired={(contract as any).deposit_required} />
          </div>
          <footer className="mt-10 pt-4 border-t text-center text-[10px] text-gray-400" data-pdf-block>
            {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret} — TVA : {COMPANY.tvaIntra}
          </footer>
        </div>

        {!regenMode && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          {signed ? (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full text-sm font-medium">
                <CheckCircle className="h-5 w-5" />
                Contrat signé{contract.signer_name ? ` par ${contract.signer_name}` : ""}
                {contract.signed_at ? ` le ${formatDateLong(contract.signed_at)}` : ""}
              </div>
              <p className="text-xs text-gray-500">Vous recevrez une confirmation par email avec le contrat signé en pièce jointe.</p>
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
        )}
      </div>
    </div>
  );
};

export default ContractSign;
