import { COMPANY } from "@/lib/companyConfig";

/**
 * Rendu UNIQUE des conditions particulières du bon de commande.
 * Utilisé à la fois par la page de signature client (ContractSign)
 * et par l'aperçu admin (ContractView) pour garantir une cohérence 100 %.
 */

export type ContractLine = { id: string; label: string; amount_ht: number; tva_rate: number; type: string };

export function computeContractLines(contract: any, speakers: any[]): ContractLine[] {
  const rawLines: ContractLine[] = Array.isArray(contract?.contract_lines) && contract.contract_lines.length > 0
    ? contract.contract_lines
    : speakers.map((s: any, i: number) => ({ id: String(i), label: s.speakers?.name || `Conférencier ${i + 1}`, amount_ht: s.total_price || 0, tva_rate: 20, type: "speaker" }));
  const commission = contract?.agency_commission || 0;
  const speakerLinesTotal = rawLines.filter(l => l.type === "speaker").reduce((s, l) => s + l.amount_ht, 0);
  if (commission > 0 && speakerLinesTotal > 0) {
    return rawLines.map(l => l.type === "speaker" ? { ...l, amount_ht: l.amount_ht + commission * (l.amount_ht / speakerLinesTotal) } : l);
  }
  if (commission > 0 && speakerLinesTotal === 0 && rawLines.length > 0) {
    return rawLines.map((l, i) => i === 0 ? { ...l, amount_ht: l.amount_ht + commission } : l);
  }
  return rawLines;
}

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "À définir";
const fmtDateLong = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
const fmtNum = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

type Props = {
  contract: any;
  client: { company_name?: string; address?: string | null; city?: string | null; siret?: string | null } | null;
  event: { bdc_number?: string | null; audience_size?: string | null; theme?: string | null } | null;
  speaker: { name: string; gender: string | null } | null;
  /** Masque le bloc des signatures (la page de signature affiche le sien) */
  hideSignatures?: boolean;
};

export function ContractParticulars({ contract, client, event, speaker, hideSignatures }: Props) {
  const proposal = contract.proposal || {};
  const speakers = proposal.proposal_speakers || [];
  const lines = computeContractLines(contract, speakers);
  const discount = contract.discount_percent || 0;
  const speakerGender = speaker?.gender === "female" ? "Madame" : "Monsieur";
  const bdcNumber = event?.bdc_number || String(contract.id).slice(0, 4).toUpperCase();
  const clientName = client?.company_name || proposal.client_name || "";
  const clientAddress = client ? `${client.address || ""} ${client.city || ""}`.trim() : "";
  const audience = event?.audience_size || proposal.audience_size || "";
  const isSigned = contract.status === "signed" || !!contract.signed_at;

  return (
    <div className="text-[13px] leading-relaxed text-gray-900">
      <div className="text-center mb-8 space-y-2" data-pdf-block>
        <h1 className="text-2xl font-bold uppercase tracking-wide">BON DE COMMANDE</h1>
        <p className="text-sm font-semibold uppercase text-gray-600">CONDITIONS PARTICULIÈRES</p>
        <p className="text-sm uppercase text-gray-500">PARTICIPATION D'UN INTERVENANT À UN ÉVÉNEMENT</p>
      </div>

      {(contract.version || 1) > 1 && (
        <div className="mb-6 border-2 border-gray-900 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide" data-pdf-block>
          Cette version v{contract.version} annule et remplace toute version précédente de ce bon de commande.
        </div>
      )}

      <div className="flex justify-between items-start mb-8" data-pdf-block>
        <p className="font-bold text-lg">Bon de commande n° : {bdcNumber}</p>
        <p className="text-sm text-gray-600">Date d'émission : {fmtDate(contract.created_at)}</p>
      </div>

      <section className="mb-8" data-pdf-block>
        <h2 className="text-lg font-bold mb-4">ENTRE</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="font-bold">{clientName}</p>
            {clientAddress && <p>{clientAddress}</p>}
            {client?.siret && <p>{client.siret}</p>}
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

      <section className="mb-8" data-pdf-block>
        <h2 className="text-lg font-bold mb-2">Intervenant</h2>
        <p>{speakerGender} {speaker?.name || "—"}</p>
        <p className="text-sm italic text-gray-600">ci-après l'« Intervenant »</p>
      </section>

      <section className="mb-8" data-pdf-block>
        <h2 className="text-lg font-bold mb-3">Détails de l'événement</h2>
        <div className="space-y-1.5">
          <p><span className="text-gray-600">Date de l'évènement :</span> {fmtDateLong(contract.event_date) || "À définir"}</p>
          <p><span className="text-gray-600">Lieu de l'intervention :</span> {contract.event_location || "À définir"}</p>
          <p><span className="text-gray-600">Horaires de l'intervention :</span> {contract.event_time || "À définir"}</p>
          {audience && <p><span className="text-gray-600">Auditoire :</span> {/personne/i.test(String(audience)) ? audience : `${audience} personnes attendues`}</p>}
          {event?.theme && <p><span className="text-gray-600">Thématique :</span> {event.theme}</p>}
          {contract.event_description && (
            <div><span className="text-gray-600">Détails :</span> <span className="whitespace-pre-line">{contract.event_description}</span></div>
          )}
        </div>
      </section>

      <section className="mb-8" data-pdf-block>
        <h2 className="text-lg font-bold mb-3">Montant de la prestation</h2>
        {lines.map((line, i) => (
          <p key={i} className="mb-1">
            {line.type === "speaker" ? "Montant de la prestation de l'intervenant" : line.label} : {fmtNum(line.amount_ht * (1 + line.tva_rate / 100))} €TTC, soit {fmtNum(line.amount_ht)} €HT{line.type === "speaker" ? ", hors frais de déplacements" : ""}
          </p>
        ))}
        {discount > 0 && <p className="text-sm text-gray-600">Remise de {discount}% appliquée</p>}
        <p className="mt-2">TVA Les conférenciers : FR - TVA applicable : 20%</p>
      </section>

      <div data-pdf-block>
        <p className="text-sm text-gray-600 mb-4">
          Les conditions générales applicables au Bon de commande sont transmises au Client et à l'Intervenant simultanément à la remise du Bon de commande.
        </p>
        <p className="text-sm text-gray-600 mb-8">
          Les conférenciers conseille, accompagne et met en relation des entreprises et des personnalités, dans le cadre d'événements professionnels et d'opérations de communication.
        </p>
      </div>

      {!hideSignatures && (
        <div data-pdf-block>
          <p className="mb-2">Le {fmtDateLong(contract.created_at)}</p>
          <p className="text-sm italic text-gray-600 mb-12">signature précédée de la mention « Bon pour accord »</p>
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="border rounded-lg p-6 min-h-[140px]">
              <p className="font-semibold mb-1">Le Client</p>
              <p className="text-sm text-gray-500 mb-2">{clientName}</p>
              {isSigned && contract.signer_name && (
                <>
                  <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] leading-tight">Bon pour accord</p>
                  <p style={{ fontFamily: "'Caveat', cursive" }} className="text-3xl text-[#1a2332] mt-1">{contract.signer_name}</p>
                  <p className="text-[10px] text-gray-400 mt-2">Signé électroniquement le {fmtDateLong(contract.signed_at)}</p>
                </>
              )}
            </div>
            <div className="border rounded-lg p-6 min-h-[140px]">
              <p className="font-semibold mb-1">Les Conférenciers</p>
              <p className="text-sm text-gray-500 mb-2">Société Eve</p>
              {isSigned && (
                <>
                  <p style={{ fontFamily: "'Caveat', cursive" }} className="text-2xl text-[#1a2332] leading-tight">Bon pour accord</p>
                  <p style={{ fontFamily: "'Caveat', cursive" }} className="text-3xl text-[#1a2332] mt-1">Nelly Sabde</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
