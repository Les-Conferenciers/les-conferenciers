import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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
  selected_speaker_id: string | null;
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

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("contracts")
        .select(`
          *,
          proposal:proposals(
            client_name, client_email, recipient_name, client_id,
            proposal_speakers(speaker_fee, travel_costs, agency_commission, total_price, speakers(name, gender))
          )
        `)
        .eq("id", id!)
        .single();
      let c = data as any;

      // Fetch selected speaker if defined on contract
      if (c?.selected_speaker_id) {
        const { data: sp } = await supabase.from("speakers").select("name, gender").eq("id", c.selected_speaker_id).maybeSingle();
        if (sp) c.selected_speaker = sp;
      }
      setContract(c);

      if (c?.proposal?.client_id) {
        const { data: cl } = await supabase.from("clients").select("company_name, contact_name, address, city, siret").eq("id", c.proposal.client_id).single();
        setClient(cl as any);
      }

      const { data: ev } = await supabase.from("events").select("bdc_number, audience_size, theme").eq("proposal_id", c?.proposal_id || c?.id).maybeSingle();
      setEvent(ev as any);

      setLoading(false);
    };
    fetchAll();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!contract) return <div className="flex items-center justify-center min-h-screen">Contrat introuvable</div>;

  const proposal = contract.proposal as any;
  const speakers = proposal?.proposal_speakers || [];
  const speakerNames = speakers.map((s: any) => s.speakers?.name || "—").join(", ");
  // Priority: contract.selected_speaker (manual selection) → first proposal speaker
  const firstSpeaker = contract.selected_speaker || speakers[0]?.speakers;
  const speakerGender = firstSpeaker?.gender === "female" ? "Madame" : "Monsieur";

  // Use contract_lines if available, else fallback
  const lines: ContractLine[] = (contract.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0)
    ? contract.contract_lines
    : speakers.map((s: any, i: number) => ({ id: String(i), label: s.speakers?.name || `Conférencier ${i + 1}`, amount_ht: s.total_price || 0, tva_rate: 20, type: "speaker" }));

  const discount = contract.discount_percent || 0;
  const subtotalHT = lines.reduce((sum, l) => sum + l.amount_ht, 0);
  const discountAmount = subtotalHT * (discount / 100);
  const totalHT = subtotalHT - discountAmount;
  const totalTVA = lines.reduce((sum, l) => {
    const share = subtotalHT > 0 ? l.amount_ht / subtotalHT : 0;
    const lineHT = l.amount_ht - (discountAmount * share);
    return sum + lineHT * (l.tva_rate / 100);
  }, 0);
  const totalTTC = totalHT + totalTVA;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "À définir";

  const formatDateLong = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  const bdcNumber = event?.bdc_number || contract.id.slice(0, 4).toUpperCase();
  const clientName = client?.company_name || proposal?.client_name || "";
  const clientAddress = client ? `${client.address || ""} ${client.city || ""}`.trim() : "";
  const clientSiret = client?.siret || "";

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} className="gap-2">
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
            <p><span className="text-gray-600">Date de l'évènement :</span> {formatDateLong(contract.event_date) || "À définir"}</p>
            <p><span className="text-gray-600">Lieu de l'intervention :</span> {contract.event_location || "À définir"}</p>
            <p><span className="text-gray-600">Horaires de l'intervention :</span> {contract.event_time || "À définir"}</p>
            {event?.audience_size && <p><span className="text-gray-600">Auditoire :</span> {event.audience_size}</p>}
            {event?.theme && <p><span className="text-gray-600">Thématique :</span> {event.theme}</p>}
            {contract.event_format && <p><span className="text-gray-600">Format :</span> {contract.event_format}</p>}
            {contract.event_description && <p className="whitespace-pre-line"><span className="text-gray-600">Détails :</span> {contract.event_description}</p>}
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
            <div>
              <h3 className="font-bold mb-2">Article 1. DÉFINITIONS</h3>
              <p>Les Parties conviennent de donner aux termes ci-dessous les définitions suivantes :</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Bon de commande :</strong> document contractuel décrivant les spécificités de la Prestation.</li>
                <li><strong>Client :</strong> Client identifié au Bon de commande.</li>
                <li><strong>Conditions générales ou CG :</strong> document contractuel qui rassemble les modalités générales de réalisation de la Prestation.</li>
                <li><strong>Contrat :</strong> ensemble contractuel liant les Parties. Il est composé d'un Bon de commande, de Conditions générales et d'éventuelles annexes.</li>
                <li><strong>Informations confidentielles :</strong> toute information, document, donnée identifiée comme confidentielle et communiquée par une partie aux autres en ce compris le prix, ce contrat en tout ou partie.</li>
                <li><strong>Intervenant :</strong> personnalité identifiée au Bon de commande chargée d'intervenir au cours de l'Événement.</li>
                <li><strong>Événement :</strong> événement identifié au Bon de commande organisé par le Client pour lequel le Client sollicite Les conférenciers afin qu'il lui propose des profils de conférencier ou d'animateurs.</li>
                <li><strong>Image de l'Intervenant :</strong> ensemble des attributs de l'Intervenant permettant de l'identifier.</li>
                <li><strong>Parties :</strong> l'Intervenant, le Client et Les conférenciers désignés ensemble ou séparément.</li>
                <li><strong>Prestation :</strong> accompagnement Les conférenciers et participation de l'Intervenant à l'Événement.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 2. OBJET ET COMPOSITION DU CONTRAT</h3>
              <p>Le Contrat a pour objet de définir les Prestations que l'Intervenant et Les Conférenciers s'engagent à réaliser au bénéfice du Client ainsi que les modalités d'utilisation de l'image de l'Intervenant par le Client.</p>
              <p className="mt-2">Le Contrat est composé d'un Bon de commande, de Conditions générales et d'éventuelles annexes. Les stipulations du Bon de commandes prévalent à celles des Conditions générales.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 3. RÉALISATION DES PRESTATIONS</h3>
              <p className="font-semibold mt-2">3.1 Accompagnement Les Conférenciers</p>
              <p>A partir des besoins identifiés par le Client, Les Conférenciers proposera à ce dernier des profils d'intervenants pertinents. Une fois que le Client, Les Conférenciers et l'Intervenant se sont accordés sur les caractéristiques principales des Prestations et que le Contrat est signé, Les Conférenciers continue à assurer l'interface entre le Client et l'Intervenant.</p>
              <p className="font-semibold mt-2">3.2 Participation de l'Intervenant à l'Événement</p>
              <p>L'Intervenant participera à l'Événement selon les conditions prévues au Bon de commande. L'Intervenant garantit à ses cocontractants la maîtrise des compétences professionnelles nécessaires à la réalisation des Prestations.</p>
              <p className="font-semibold mt-2">3.3 Engagements du Client</p>
              <p>Le Client reconnaît avoir transmis aux Conférenciers les éléments fondamentaux de sa recherche dès leurs premiers échanges. Un mois avant l'Événement, le Client s'engage à transmettre à ses cocontractants la liste exhaustive des éléments leur permettant de réaliser leur Prestation.</p>
              <p className="font-semibold mt-2">3.4 Relations entre les Parties</p>
              <p><strong>Rendez-vous tripartite :</strong> Les modalités précises de la Prestation seront définies au moyen d'un rendez-vous téléphonique d'une durée minimale de trente (30) minutes.</p>
              <p><strong>Loyauté :</strong> Chaque Partie s'engage à tenir informés ses cocontractants de tout changement ou difficulté pouvant impacter l'exécution du Contrat.</p>
              <p><strong>Confidentialité :</strong> Les Parties s'engagent à ne pas porter atteinte à l'image des autres et s'interdisent de divulguer toutes les Informations confidentielles.</p>
              <p><strong>Exclusivité :</strong> Le client s'interdit de contacter l'intervenant directement ou indirectement pendant 3 (trois) ans à compter de la signature des présentes, sauf par l'intermédiaire de l'Agence Les Conférenciers.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 4. DROIT À L'IMAGE ET DROIT D'AUTEUR</h3>
              <p><strong>4.1.</strong> En contrepartie de la rémunération visée à l'article 5, l'Intervenant accepte de communiquer au public et exposer de manière orale sa conférence lors du jour de la manifestation. Le Client reconnaît que le Contrat ne lui confère aucun droit de propriété intellectuelle sur les documents réalisés par l'Intervenant.</p>
              <p className="mt-1"><strong>4.2.</strong> Avant l'Évènement : L'Intervenant s'engage à communiquer une photographie le représentant afin de permettre la communication pendant les deux mois qui précèdent l'Événement.</p>
              <p className="mt-1"><strong>4.3.</strong> Pendant l'Évènement : L'autorisation de captation devra être mentionnée dans les conditions particulières du Bon de commande. A défaut d'accord, aucune captation ne pourra être réalisée.</p>
              <p className="mt-1"><strong>4.4.</strong> Après l'Événement : Le Client pourra conserver des extraits (maximum 4, durée max 1min30 chacun) pour usage interne pendant 3 mois maximum.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 5. MODALITÉS FINANCIÈRES</h3>
              <p><strong>5.1 Prix de la Prestation.</strong> Le montant de la Prestation est détaillé au Bon de commande. Le Client s'engage à verser 50% du montant total dans les 30 jours suivants la signature. 100% du montant devra être reçu au plus tard sept jours avant la tenue de l'Événement.</p>
              <p className="mt-1"><strong>5.2 Frais de déplacement et hébergement.</strong> Les Conférenciers prendra en charge la réservation des transports nécessaires. Les Conférenciers facturera les frais avancés au Client sur présentation de justificatif.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 6. DURÉE DU CONTRAT</h3>
              <p>Le Contrat entre en vigueur à la date de sa signature et jusqu'au mois qui suit l'extinction des obligations des articles 3, 4 et 5.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 7. MODIFICATION DES PRESTATIONS</h3>
              <p><strong>7.1 Modification.</strong> Les Parties pourront modifier d'un commun accord écrit les Prestations jusqu'à sept jours ouvrables avant l'Événement.</p>
              <p className="mt-1"><strong>7.2 Suspension.</strong> En cas de Force majeure, l'exécution serait suspendue. Si l'événement perdurait plus de 30 jours, le Contrat serait résilié.</p>
              <p className="mt-1"><strong>7.3 Annulation.</strong> Annulation par le Client :</p>
              <ul className="list-disc pl-5 mt-1">
                <li>À plus de 30 jours de l'Évènement : 50% du montant de la prestation</li>
                <li>Entre 30 et le jour de l'Évènement : 100% du montant de la prestation</li>
              </ul>
              <p className="mt-1">En cas d'annulation par l'Intervenant, Les Conférenciers s'engage à proposer au Client des profils susceptibles de se substituer.</p>
              <p className="mt-1"><strong>7.4 Résiliation.</strong> En cas de manquement, la Partie défaillante aura 30 jours après mise en demeure pour y remédier.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 8. FORCE MAJEURE</h3>
              <p>Chacune des Parties sera exonérée de toute responsabilité en cas de manquement causé par un cas de Force majeure : événement imprévisible et irrésistible, résultant d'un fait extérieur (nature climatique, pandémique, militaire, politique ou diplomatique).</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 9. IMPRÉVISION</h3>
              <p>Lorsqu'une Partie prouve que l'exécution de ses obligations est devenue excessivement onéreuse (variation de plus de 30% du prix), elle peut demander une renégociation du Contrat. Les Parties s'engagent à organiser une tentative de conciliation de 10 jours.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 10. OBLIGATIONS LÉGALES - RESPONSABILITÉS</h3>
              <p><strong>Déclarations administratives :</strong> Chaque Partie demeure responsable de ses obligations légales, sociales et fiscales.</p>
              <p><strong>Données personnelles :</strong> Les Parties s'engagent à assurer la protection des données à caractère personnel conformément à la législation en vigueur.</p>
              <p><strong>Recours à un tiers :</strong> Si une Partie fait appel à un prestataire, ce tiers demeure sous son autorité exclusive.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 11. DIVERS</h3>
              <p><strong>Capacité :</strong> Chaque Partie certifie avoir la capacité d'agir au Contrat. Les Parties reconnaissent la force probante de la signature électronique.</p>
              <p><strong>Indépendance des Parties :</strong> Aucune stipulation ne pourra être interprétée comme un lien de subordination.</p>
              <p><strong>Cession :</strong> Le Contrat est conclu intuitu personae.</p>
              <p><strong>Nullité :</strong> La nullité d'une clause n'entraîne pas la nullité de l'ensemble.</p>
              <p><strong>Droit applicable :</strong> Le Contrat est soumis à la loi française. Tribunal de Grande Instance de Paris compétent.</p>
            </div>
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
