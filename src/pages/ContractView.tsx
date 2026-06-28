import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Printer, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_CLAUSES, getClauseHtml, getCustomClausesText, isClauseRemoved } from "@/lib/contractClauses";

type ContractLine = {
  id: string;
  label: string;
  amount_ht: number;
  tva_rate: number;
  type: string;
};

type ContractData = {
  id: string;
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
  deposit_required?: boolean | null;
  custom_clauses?: any;
  selected_speaker_id: string | null;
  proposal_id?: string;
  version?: number | null;
  replaces_contract_id?: string | null;

  selected_speaker?: { name: string; gender: string | null } | null;
  proposal: {
    client_name: string;
    client_email: string;
    recipient_name: string | null;
    client_id: string | null;
    proposal_speakers: {
      speaker_fee: number | null;
      travel_costs: number | null;
      agency_commission: number | null;
      total_price: number | null;
      speakers: { name: string; gender: string | null } | null;
    }[];
  };
};

type ClientData = {
  company_name: string;
  contact_name: string | null;
  address: string | null;
  city: string | null;
  siret: string | null;
};

type EventData = {
  id?: string;
  bdc_number: string | null;
  audience_size: string | null;
  theme: string | null;
};

const ContractView = () => {
  const { id } = useParams();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allSpeakers, setAllSpeakers] = useState<{ id: string; name: string; gender: string | null }[]>([]);

  // Editable fields
  const [evDate, setEvDate] = useState("");
  const [evLocation, setEvLocation] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evFormat, setEvFormat] = useState("");
  const [evDescription, setEvDescription] = useState("");
  const [evAudience, setEvAudience] = useState("");
  const [evTheme, setEvTheme] = useState("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");

  const fetchAll = async () => {
    const { data } = await supabase
      .from("contracts")
      .select(`
        *,
        proposal:proposals(
          client_name, client_email, recipient_name, client_id, audience_size,
          proposal_speakers(speaker_fee, travel_costs, agency_commission, total_price, speakers(name, gender))
        )
      `)
      .eq("id", id!)
      .single();
    let c = data as any;

    const { data: ev } = await supabase
      .from("events")
      .select("id, bdc_number, audience_size, theme, selected_speaker_id")
      .eq("proposal_id", c?.proposal_id || c?.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setEvent(ev as any);

    const effectiveSpeakerId = c?.selected_speaker_id || (ev as any)?.selected_speaker_id;
    if (effectiveSpeakerId) {
      const { data: sp } = await supabase.from("speakers").select("name, gender").eq("id", effectiveSpeakerId).maybeSingle();
      if (sp) c.selected_speaker = sp;
    }
    setContract(c);

    if (c?.proposal?.client_id) {
      const { data: cl } = await supabase.from("clients").select("company_name, contact_name, address, city, siret").eq("id", c.proposal.client_id).single();
      setClient(cl as any);
    }


    if (c) {
      setEvDate(c.event_date || "");
      setEvLocation(c.event_location || "");
      setEvTime(c.event_time || "");
      setEvFormat(c.event_format || "");
      setEvDescription(c.event_description || "");
    }
    setEvAudience((ev as any)?.audience_size || c?.proposal?.audience_size || "");
    setEvTheme((ev as any)?.theme || "");
    setSelectedSpeakerId(c?.selected_speaker_id || (ev as any)?.selected_speaker_id || "");

    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
      if (session) setEditing(true);
    });
    fetchAll();
  }, [id]);

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);
    const { error: cErr } = await supabase.from("contracts").update({
      event_date: evDate || null,
      event_location: evLocation || null,
      event_time: evTime || null,
      event_format: evFormat || null,
      event_description: evDescription.trim() || null,
    } as any).eq("id", contract.id);

    let evErr: any = null;
    if (event?.id) {
      const { error } = await supabase.from("events").update({
        audience_size: evAudience || null,
        theme: evTheme.trim() || null,
      } as any).eq("id", event.id);
      evErr = error;
    }

    if (cErr || evErr) {
      toast.error("Erreur de sauvegarde");
    } else {
      toast.success("Contrat mis à jour");
      setEditing(false);
      await fetchAll();
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen">Contrat introuvable</div>;

  const proposal = contract.proposal as any;
  const speakers = proposal?.proposal_speakers || [];
  const firstSpeaker = contract.selected_speaker || speakers[0]?.speakers;
  const speakerGender = firstSpeaker?.gender === "female" ? "Madame" : "Monsieur";

  const rawLines: ContractLine[] = (contract.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0)
    ? contract.contract_lines
    : speakers.map((s: any, i: number) => ({ id: String(i), label: s.speakers?.name || `Conférencier ${i + 1}`, amount_ht: s.total_price || 0, tva_rate: 20, type: "speaker" }));

  const commission = contract.agency_commission || 0;
  const speakerLinesTotal = rawLines.filter(l => l.type === "speaker").reduce((s, l) => s + l.amount_ht, 0);
  const lines: ContractLine[] = commission > 0 && speakerLinesTotal > 0
    ? rawLines.map(l => l.type === "speaker"
        ? { ...l, amount_ht: l.amount_ht + commission * (l.amount_ht / speakerLinesTotal) }
        : l)
    : (commission > 0 && speakerLinesTotal === 0 && rawLines.length > 0
        ? rawLines.map((l, i) => i === 0 ? { ...l, amount_ht: l.amount_ht + commission } : l)
        : rawLines);

  const discount = contract.discount_percent || 0;
  const subtotalHT = lines.reduce((sum, l) => sum + l.amount_ht, 0);
  const discountAmount = subtotalHT * (discount / 100);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "À définir";
  const formatDateLong = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  const bdcNumber = event?.bdc_number || contract.id.slice(0, 4).toUpperCase();
  const clientName = client?.company_name || proposal?.client_name || "";
  const clientAddress = client ? `${client.address || ""} ${client.city || ""}`.trim() : "";
  const clientSiret = client?.siret || "";
  const displayAudience = event?.audience_size || evAudience || proposal?.audience_size || "";

  const inputCls = "border border-primary/30 rounded px-2 py-0.5 text-sm bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        {isAdmin && !editing && (
          <Button onClick={() => setEditing(true)} variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
        )}
        {isAdmin && editing && (
          <>
            <Button onClick={() => { setEditing(false); fetchAll(); }} variant="outline" className="gap-2">
              <X className="h-4 w-4" /> Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Sauvegarde…" : "Enregistrer"}
            </Button>
          </>
        )}
        <Button onClick={() => window.print()} className="gap-2" variant={editing ? "outline" : "default"}>
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto p-8 print:p-6 text-[13px] leading-relaxed text-gray-900">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-wide">BON DE COMMANDE</h1>
          <p className="text-sm font-semibold uppercase text-gray-600">CONDITIONS PARTICULIÈRES</p>
          <p className="text-sm uppercase text-gray-500">PARTICIPATION D'UN INTERVENANT À UN ÉVÉNEMENT</p>
        </div>

        {(contract.version || 1) > 1 && (
          <div className="mb-6 border-2 border-gray-900 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide">
            Cette version v{contract.version} annule et remplace toute version précédente de ce bon de commande.
          </div>
        )}


        <div className="flex justify-between items-start mb-8">
          <p className="font-bold text-lg">Bon de commande n° : {bdcNumber}</p>
          <p className="text-sm text-gray-600">Date d'émission : {formatDate(contract.created_at)}</p>
        </div>

        {/* ENTRE */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">ENTRE</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="font-bold">{clientName}</p>
              {clientAddress && <p>{clientAddress}</p>}
              {clientSiret && <p>{clientSiret}</p>}
              <p className="text-sm italic text-gray-600 mt-2">(ci-après le « Client »)</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold">Les Conférenciers</p>
              <p>Société Eve</p>
              <p className="text-sm italic text-gray-600 mt-1">(ci-après « Les conférenciers »)</p>
              <p className="text-sm">N° SIREN : {COMPANY.siret}</p>
              <p className="text-sm">Adresse : {COMPANY.fullAddress}</p>
            </div>
          </div>
        </section>

        {/* Intervenant */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2">Intervenant</h2>
          <p>{speakerGender} {firstSpeaker?.name || "—"}</p>
          <p className="text-sm italic text-gray-600">ci-après l'« Intervenant »</p>
        </section>

        {/* Détails de l'événement */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Détails de l'événement</h2>
          <div className="space-y-1.5">
            <p>
              <span className="text-gray-600">Date de l'évènement :</span>{" "}
              {editing
                ? <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className={inputCls} />
                : (formatDateLong(contract.event_date) || "À définir")}
            </p>
            <p>
              <span className="text-gray-600">Lieu de l'intervention :</span>{" "}
              {editing
                ? <input type="text" value={evLocation} onChange={e => setEvLocation(e.target.value)} className={inputCls + " w-full max-w-[640px]"} />
                : (contract.event_location || "À définir")}
            </p>
            <p>
              <span className="text-gray-600">Horaires de l'intervention :</span>{" "}
              {editing
                ? <input type="text" value={evTime} onChange={e => setEvTime(e.target.value)} className={inputCls + " w-full max-w-[420px]"} />
                : (contract.event_time || "À définir")}
            </p>
            {(editing || displayAudience) && (
              <p>
                <span className="text-gray-600">Auditoire :</span>{" "}
                {editing
                  ? <input type="text" value={evAudience} onChange={e => setEvAudience(e.target.value)} className={inputCls} />
                  : `${displayAudience} personnes attendues`}
              </p>
            )}
            {(editing ? evTheme.length > 0 : !!event?.theme) && (
              <p>
                <span className="text-gray-600">Thématique :</span>{" "}
                {editing
                  ? <input type="text" value={evTheme} onChange={e => setEvTheme(e.target.value)} className={inputCls + " w-full max-w-[640px]"} autoFocus />
                  : event?.theme}
              </p>
            )}
            {(editing ? evDescription.length > 0 : !!contract.event_description) && (
              <div>
                <span className="text-gray-600">Détails :</span>{" "}
                {editing
                  ? <textarea value={evDescription} onChange={e => setEvDescription(e.target.value)} rows={3} className={"block w-full mt-1 " + inputCls} autoFocus />
                  : <span className="whitespace-pre-line">{contract.event_description}</span>}
              </div>
            )}
            {editing && (evTheme.length === 0 || evDescription.length === 0) && (
              <div className="flex gap-2 pt-2">
                {evTheme.length === 0 && (
                  <button type="button" onClick={() => setEvTheme(" ")} className="text-xs px-2 py-1 border border-dashed border-gray-400 rounded hover:bg-gray-50 text-gray-600">
                    + Ajouter une thématique
                  </button>
                )}
                {evDescription.length === 0 && (
                  <button type="button" onClick={() => setEvDescription(" ")} className="text-xs px-2 py-1 border border-dashed border-gray-400 rounded hover:bg-gray-50 text-gray-600">
                    + Ajouter des détails
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Montant de la prestation */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Montant de la prestation</h2>
          {lines.map((line, i) => (
            <p key={i} className="mb-1">
              {line.type === "speaker" ? `Montant de la prestation de l'intervenant` : line.label} : {(line.amount_ht * (1 + line.tva_rate / 100)).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €TTC, soit {line.amount_ht.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €HT{line.type === "speaker" ? ", hors frais de déplacements" : ""}
            </p>
          ))}
          {discount > 0 && <p className="text-sm text-gray-600">Remise de {discount}% appliquée</p>}
          <p className="mt-2">TVA Les conférenciers : FR - TVA applicable : 20%</p>
        </section>

        <p className="text-sm text-gray-600 mb-4">
          Les conditions générales applicables au Bon de commande sont transmises au Client et à l'Intervenant simultanément à la remise du Bon de commande.
        </p>
        <p className="text-sm text-gray-600 mb-8">
          Les conférenciers conseille, accompagne et met en relation des entreprises et des personnalités, dans le cadre d'événements professionnels et d'opérations de communication.
        </p>

        <p className="mb-2">Le {formatDateLong(contract.created_at) || formatDate(contract.created_at)}</p>
        <p className="text-sm italic text-gray-600 mb-12">signature précédée de la mention « Bon pour accord »</p>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="border rounded-lg p-6 min-h-[140px]">
            <p className="font-semibold mb-1">Le Client</p>
            <p className="text-sm text-gray-500 mb-2">{clientName}</p>
            {contract.status === "signed" && contract.signer_name && (
              <>
                <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] leading-tight">Bon pour accord</p>
                <p style={{ fontFamily: "'Caveat', cursive" }} className="text-3xl text-[#1a2332] mt-1">{contract.signer_name}</p>
                <p className="text-[10px] text-gray-400 mt-2">Signé électroniquement le {formatDateLong(contract.signed_at)}</p>
              </>
            )}
          </div>
          <div className="border rounded-lg p-6 min-h-[140px]">
            <p className="font-semibold mb-1">Les Conférenciers</p>
            <p className="text-sm text-gray-500 mb-2">Société Eve</p>
            {contract.status === "signed" && (
              <>
                <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] leading-tight">Bon pour accord</p>
                <p style={{ fontFamily: "'Caveat', cursive" }} className="text-3xl text-[#1a2332] mt-1">Nelly Sabde</p>
              </>
            )}
          </div>
        </div>

        {/* CONDITIONS GENERALES - Page break */}
        <div className="break-before-page">
          <h1 className="text-xl font-bold text-center mb-8 uppercase">CONDITIONS GÉNÉRALES</h1>

          <div className="space-y-6 text-[12px] leading-relaxed">
            {(() => {
              const visibleClauses = DEFAULT_CLAUSES.filter(
                (c) => !isClauseRemoved(c.key, contract.custom_clauses)
              );
              const art5VisibleIndex = visibleClauses.findIndex((c) => c.key === "art5");
              return visibleClauses.map((clause, idx) => {
                const displayNum = idx + 1;
                const priceClause = contract.deposit_required === false
                  ? `<p><strong>${displayNum}.1 Prix de la Prestation.</strong> Le montant de la Prestation est détaillé au Bon de commande. Le Client s'engage à régler 100% du montant total au plus tard sept jours avant la tenue de l'Événement.</p>`
                  : `<p><strong>${displayNum}.1 Prix de la Prestation.</strong> Le montant de la Prestation est détaillé au Bon de commande. Le Client s'engage à verser 50% du montant total dans les 30 jours suivants la signature. 100% du montant devra être reçu au plus tard sept jours avant la tenue de l'Événement.</p>`;
                const html = getClauseHtml(clause.key, contract.custom_clauses, { PRICE_CLAUSE: priceClause });

                const customText = getCustomClausesText(contract.custom_clauses);
                const isArt5 = clause.key === "art5";
                const insertCustomHere = customText && (
                  art5VisibleIndex >= 0 ? isArt5 : idx === visibleClauses.length - 1
                );
                const dynamicTitle = clause.title.replace(/^Article\s+\d+\./i, `Article ${displayNum}.`);

                return (
                  <div key={clause.key}>
                    <div>
                      <h3 className="font-bold mb-2">{dynamicTitle}</h3>
                      <div
                        className="[&_p]:mt-0 [&_ul]:my-2"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </div>

                    {insertCustomHere && (
                      <div className="mt-6">
                        <h3 className="font-bold mb-2">CONDITIONS PARTICULIÈRES</h3>
                        <div className="whitespace-pre-wrap text-[13px]">{customText}</div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t text-center text-[10px] text-gray-400">
          {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret} — TVA : {COMPANY.tvaIntra}
        </footer>
      </div>
    </div>
  );
};

export default ContractView;
