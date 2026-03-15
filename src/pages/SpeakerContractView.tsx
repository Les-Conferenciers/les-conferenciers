import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/companyConfig";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const SpeakerContractView = () => {
  const { id } = useParams(); // proposal_id
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Get event + contract + proposal data
      const { data: ev } = await supabase
        .from("events")
        .select("*, proposal:proposals(client_name, client_email, recipient_name, client_id, proposal_speakers(speaker_fee, total_price, speakers(name, gender, city, email, phone)))")
        .eq("proposal_id", id!)
        .maybeSingle();

      const { data: contract } = await supabase
        .from("contracts")
        .select("event_date, event_location, event_time, event_format, created_at, contract_lines, discount_percent")
        .eq("proposal_id", id!)
        .maybeSingle();

      let client = null;
      if (ev?.proposal?.client_id) {
        const { data: cl } = await supabase.from("clients").select("company_name").eq("id", ev.proposal.client_id).single();
        client = cl;
      }

      setData({ event: ev, contract, client });
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!data?.event) return <div className="flex items-center justify-center min-h-screen">Dossier introuvable</div>;

  const ev = data.event;
  const proposal = ev.proposal;
  const contract = data.contract;
  const selectedSpeakerId = ev.selected_speaker_id;
  const ps = proposal?.proposal_speakers?.find((s: any) => s.speakers && (selectedSpeakerId ? s.speaker_id === selectedSpeakerId : true)) || proposal?.proposal_speakers?.[0];
  const speaker = ps?.speakers;
  const clientName = data.client?.company_name || proposal?.client_name || "";
  const bdcNumber = ev.bdc_number || "";
  const speakerBudget = ev.speaker_budget || ps?.speaker_fee || 0;
  const speakerBudgetTTC = speakerBudget * 1.2;

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "À définir";
  const formatDateShort = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

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
          <p className="text-sm uppercase text-gray-500">PARTICIPATION D'UN INTERVENANT À UN ÉVÉNEMENT</p>
        </div>

        <div className="flex justify-between items-start mb-8">
          <p className="font-bold text-lg">Bon de commande n° : {bdcNumber}</p>
          <p className="text-sm text-gray-600">Date d'émission : {formatDateShort(contract?.created_at)}</p>
        </div>

        {/* ENTRE — Speaker is the first party here */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">ENTRE</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="font-bold">{speaker?.name || "—"}</p>
              {speaker?.city && <p>{speaker.city}</p>}
              <p className="text-sm italic text-gray-600 mt-2">ci-après l'« Intervenant »</p>
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

        {/* Client */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2">Client :</h2>
          <p>{clientName}</p>
        </section>

        {/* Détails */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Détails de l'événement</h2>
          <div className="space-y-1.5">
            <p><span className="text-gray-600">Date de l'évènement :</span> {formatDate(contract?.event_date)}</p>
            <p><span className="text-gray-600">Lieu de la conférence :</span> {contract?.event_location || "À définir"}</p>
            <p><span className="text-gray-600">Horaire de la conférence :</span> {contract?.event_time || "À définir"}</p>
            {ev.audience_size && <p><span className="text-gray-600">Auditoire :</span> environ {ev.audience_size}</p>}
            {ev.theme && <p><span className="text-gray-600">Thématique de l'intervention :</span> « {ev.theme} »</p>}
          </div>
        </section>

        {/* Montant */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Montant de la prestation</h2>
          <p>
            Montant de la prestation de l'intervenant : {speakerBudgetTTC.toLocaleString("fr-FR")} € TTC, soit {speakerBudget.toLocaleString("fr-FR")} € HT, hors frais VHR
          </p>
          <p className="mt-2">TVA Les conférenciers : FR - TVA applicable : 20%</p>
        </section>

        <p className="text-sm text-gray-600 mb-4">
          Les conditions générales applicables au Bon de commande sont transmises au Client et à l'Intervenant simultanément à la remise du Bon de commande.
        </p>
        <p className="text-sm text-gray-600 mb-8">
          Les conférenciers conseille, accompagne et met en relation des entreprises et des personnalités, dans le cadre d'événements professionnels et d'opérations de communication.
        </p>

        <p className="mb-2">Le {formatDate(contract?.created_at)}</p>
        <p className="text-sm italic text-gray-600 mb-12">signature précédée de la mention « Bon pour accord »</p>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="border rounded-lg p-6 min-h-[120px]">
            <p className="font-semibold mb-1">L'Intervenant</p>
            <p className="text-sm text-gray-500">{speaker?.name || "—"}</p>
          </div>
          <div className="border rounded-lg p-6 min-h-[120px]">
            <p className="font-semibold mb-1">Les Conférenciers</p>
            <p className="text-sm text-gray-500">Société Eve</p>
          </div>
        </div>

        {/* Conditions générales du contrat conférencier */}
        <div className="break-before-page">
          <div className="space-y-6 text-[12px] leading-relaxed">
            <div>
              <h3 className="font-bold mb-2">Article 1</h3>
              <p>1.2. L'intervenant se conformera aux indications qui lui seront fournies par écrit par l'Agence Les Conférenciers, compte tenu des objectifs et thème de la manifestation. L'Intervenant accepte également de se rendre à une réunion ou de participer à un entretien téléphonique de préparation.</p>
              <p className="mt-1">1.3. L'Agence Les Conférenciers s'engage à n'imposer à l'intervenant aucune forme particulière à l'intervention commandée à la condition expresse que l'ordre public, les bonnes mœurs et les lois et règlements en vigueur ne soient pas bafoués.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 2 : DROIT À L'IMAGE ET DROIT D'AUTEUR</h3>
              <p>2.1. L'Intervenant accepte de communiquer au public et exposer de manière orale sa conférence lors du jour de la manifestation. Le Client reconnaît que le Contrat ne lui confère aucun droit de propriété intellectuelle sur les documents réalisés par l'Intervenant.</p>
              <p className="mt-1">2.2. Avant l'Évènement : L'Intervenant s'engage à communiquer une photographie le représentant afin de permettre la communication pendant les deux mois qui précèdent l'Événement.</p>
              <p className="mt-1">2.3. Pendant l'Évènement : Si l'Intervenant autorise la captation de son Image, l'accord pour diffusion devra être mentionné dans les conditions particulières du Bon de commande.</p>
              <p className="mt-1">2.4. Après l'Événement : Le Client pourra conserver des extraits (max 4, durée max 1min30) pour usage interne pendant 3 mois maximum.</p>
              <p className="mt-1">2.5. L'Agence s'interdit d'exploiter la conférence sans le consentement exprès de l'Intervenant.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 3 : Protection des droits</h3>
              <p>3.1. L'intervenant déclare avoir seul qualité pour consentir les autorisations objet des présentes.</p>
              <p className="mt-1">3.2. L'Intervenant garantit à l'Agence Les Conférenciers la jouissance paisible des autorisations consenties.</p>
              <p className="mt-1">3.3. L'Intervenant garantit l'Agence contre tout recours de tiers.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 4 : Présentation de la conférence et participation</h3>
              <p>Les modalités précises seront définies au moyen d'un rendez-vous téléphonique de 30 minutes minimum. L'Intervenant s'engage à ce que sa conférence soit présentée et exposée au cours de la manifestation.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 5 : Rémunération</h3>
              <p>L'intervenant percevra une rémunération sur présentation de facture, majorée de la TVA. Le règlement interviendra par chèque ou virement bancaire. Les frais de déplacement et d'hébergement seront remboursés à l'issue de la convention sur présentation de justificatif.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 6 : Cas de force majeure</h3>
              <p>Les cas de force majeure reconnus par la législation et la jurisprudence ne donneront lieu à aucun versement d'indemnités.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 7 : Clause d'exclusivité</h3>
              <p>L'intervenant s'interdit de participer à toute convention organisée par le client pendant 3 ans à compter de la signature, sauf par l'intermédiaire de l'Agence Les Conférenciers.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Article 8 : Loi applicable et différend</h3>
              <p>8.1. Les présentes sont soumises à la loi française.</p>
              <p>8.2. En cas de litige, les parties conviennent de s'en remettre aux Tribunaux de Paris après épuisement des voies amiables.</p>
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-4 border-t text-center text-[10px] text-gray-400">
          {COMPANY.name} — {COMPANY.legalForm} — {COMPANY.fullAddress} — SIRET : {COMPANY.siret} — TVA : {COMPANY.tvaIntra}
        </footer>
      </div>
    </div>
  );
};

export default SpeakerContractView;
