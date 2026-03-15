import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const LiaisonSheetView = () => {
  const { id } = useParams(); // proposal_id
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("*, proposal:proposals(client_name, recipient_name, client_email, proposal_speakers(speakers(name, phone)))")
        .eq("proposal_id", id!)
        .maybeSingle();

      const { data: contract } = await supabase
        .from("contracts")
        .select("event_date, event_location, event_time")
        .eq("proposal_id", id!)
        .maybeSingle();

      setData({ event: ev, contract });
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!data?.event) return <div className="flex items-center justify-center min-h-screen">Dossier introuvable</div>;

  const ev = data.event;
  const contract = data.contract;
  const proposal = ev.proposal;
  const selectedSpeakerId = ev.selected_speaker_id;
  const ps = proposal?.proposal_speakers?.find((s: any) => selectedSpeakerId ? s.speaker_id === selectedSpeakerId : true) || proposal?.proposal_speakers?.[0];
  const speaker = ps?.speakers;

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "À définir";

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      <div className="max-w-[700px] mx-auto p-8 print:p-6 text-[14px] leading-relaxed text-gray-900">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold uppercase tracking-wide">LES CONFÉRENCIERS</h1>
          <p className="text-sm text-gray-500 mt-1">www.lesconferenciers.com</p>
        </div>

        <h2 className="text-xl font-bold text-center mb-8">Feuille de Liaison</h2>

        {/* Informations Générales */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-4">Informations Générales :</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Date de l'évènement :</span> {formatDate(contract?.event_date)}</p>
            <p><span className="font-medium">Lieu de l'intervention :</span> {contract?.event_location || "À définir"}</p>
            <p><span className="font-medium">Horaires de l'intervention :</span> {contract?.event_time || "À définir"}</p>
            <p><span className="font-medium">Auditoire :</span> {ev.audience_size || "À définir"}</p>
            <p><span className="font-medium">Thématique :</span> {ev.theme || "À définir"}</p>
            <p><span className="font-medium">Arrivée du conférencier sur place :</span> {ev.visio_notes || "À confirmer"}</p>
          </div>
        </section>

        {/* Besoins techniques */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-3">Besoins techniques :</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vidéoprojecteur</li>
            <li>Salle installée en largeur avec une allée centrale si possible</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-3">Contact :</h3>
          <p><span className="font-medium">Contact client :</span> {proposal?.recipient_name || proposal?.client_name || "—"}</p>
          <p><span className="font-medium">Contact conférencier :</span> {speaker?.name || "—"} {speaker?.phone || ""}</p>
        </section>

        {/* Commentaires */}
        {ev.notes && (
          <section className="mb-8">
            <h3 className="font-bold text-lg mb-3">Commentaires :</h3>
            <p>{ev.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
};

export default LiaisonSheetView;
