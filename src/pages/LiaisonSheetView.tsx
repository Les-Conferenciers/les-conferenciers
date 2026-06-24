import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

const EditableField = ({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="border border-primary/30 rounded px-2 py-0.5 text-sm bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
  />
);

const EditableTextArea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="block w-full border border-primary/30 rounded px-2 py-1 text-sm bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-primary"
  />
);

const Field = ({ editing, value, onChange, type = "text", placeholder }: { editing: boolean; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) =>
  editing ? (
    <EditableField value={value} onChange={onChange} type={type} placeholder={placeholder} />
  ) : (
    <span>{value || (placeholder || "À définir")}</span>
  );

const TextArea = ({ editing, value, onChange, placeholder, rows = 3 }: { editing: boolean; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) =>
  editing ? (
    <EditableTextArea value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
  ) : (
    <span className="whitespace-pre-line">{value || (placeholder || "—")}</span>
  );

const LiaisonSheetView = () => {
  const params = useParams();
  const location = useLocation();
  const isPublic = location.pathname.startsWith("/feuille-liaison/");
  const token = isPublic ? params.token : undefined;
  const routeId = !isPublic ? params.id : undefined;
  const [proposalId, setProposalId] = useState<string | null>(routeId || null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Champs éditables (event)
  const [eventTheme, setEventTheme] = useState("");
  const [eventAudience, setEventAudience] = useState("");
  const [eventArrival, setEventArrival] = useState("");
  const [eventTechNeeds, setEventTechNeeds] = useState("");
  const [eventRoomSetup, setEventRoomSetup] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  // Champs éditables (contract)
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  // Téléphones override (event)
  const [clientPhone, setClientPhone] = useState("");
  const [speakerPhone, setSpeakerPhone] = useState("");

  const loadData = async () => {
    let ev: any = null;
    if (isPublic && token) {
      const { data } = await supabase
        .from("events")
        .select("*, proposal:proposals(client_name, recipient_name, client_phone, proposal_speakers(speaker_id, speakers(name, phone)))")
        .eq("token", token)
        .maybeSingle();
      ev = data;
    } else if (routeId) {
      const { data } = await supabase
        .from("events")
        .select("*, proposal:proposals(client_name, recipient_name, client_phone, proposal_speakers(speaker_id, speakers(name, phone)))")
        .eq("proposal_id", routeId)
        .maybeSingle();
      ev = data;
    }

    const pid = ev?.proposal_id || routeId || null;
    setProposalId(pid);

    const { data: contract } = pid
      ? await supabase
          .from("contracts")
          .select("event_date, event_location, event_time, event_description")
          .eq("proposal_id", pid)
          .maybeSingle()
      : { data: null };

    setData({ event: ev, contract });
    if (ev) {
      setEventTheme(ev.theme || "");
      setEventAudience(ev.audience_size || "");
      setEventArrival(ev.arrival_info || "");
      setEventTechNeeds(ev.tech_needs || "");
      setEventRoomSetup(ev.room_setup || "");
      setEventNotes(ev.notes || "");
      setClientPhone(ev.contact_on_site_phone || ev.proposal?.client_phone || "");
      const sp = ev.proposal?.proposal_speakers?.[0]?.speakers;
      setSpeakerPhone(ev.speaker_contact_phone || sp?.phone || "");
    }
    if (contract) {
      setEventDate(contract.event_date || "");
      setEventLocation(contract.event_location || "");
      setEventTime(contract.event_time || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const admin = !!session && !isPublic;
      setIsAdmin(admin);
      if (admin) setEditing(true);
    });
    loadData();
  }, [routeId, token, isPublic]);

  const handleSave = async () => {
    if (!data?.event) return;
    setSaving(true);
    const { error: evErr } = await supabase.from("events").update({
      theme: eventTheme || null,
      audience_size: eventAudience || null,
      arrival_info: eventArrival || null,
      tech_needs: eventTechNeeds || null,
      room_setup: eventRoomSetup || null,
      notes: eventNotes || null,
      contact_on_site_phone: clientPhone || null,
      speaker_contact_phone: speakerPhone || null,
    } as any).eq("id", data.event.id);

    let contractErr: any = null;
    if (data.contract) {
      const { error } = await supabase.from("contracts")
        .update({
          event_date: eventDate || null,
          event_location: eventLocation || null,
          event_time: eventTime || null,
        } as any)
        .eq("proposal_id", proposalId!);
      contractErr = error;
    }

    if (evErr || contractErr) {
      toast.error("Erreur de sauvegarde");
    } else {
      toast.success("Feuille de liaison mise à jour");
      setEditing(false);
      await loadData();
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Chargement…</div>;
  if (!data?.event) return <div className="flex items-center justify-center min-h-screen">Dossier introuvable</div>;

  const ev = data.event;
  const contract = data.contract;
  const proposal = ev.proposal;
  const selectedSpeakerId = ev.selected_speaker_id;
  const ps = proposal?.proposal_speakers?.find((s: any) => selectedSpeakerId ? s.speaker_id === selectedSpeakerId : true) || proposal?.proposal_speakers?.[0];
  const speaker = ps?.speakers;

  const formatDate = (d: string | null) => d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "À définir";


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
            <Button onClick={() => { setEditing(false); loadData(); }} variant="outline" className="gap-2">
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
            <p>
              <span className="font-medium">Date de l'évènement :</span>{" "}
              {editing ? (
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="border border-primary/30 rounded px-2 py-0.5 text-sm bg-yellow-50" />
              ) : (
                formatDate(contract?.event_date)
              )}
            </p>
            <p>
              <span className="font-medium">Lieu de l'intervention :</span>{" "}
              {editing ? (
                <EditableTextArea value={eventLocation} onChange={setEventLocation} placeholder="À définir" rows={2} />
              ) : (
                <span className="whitespace-pre-line">{eventLocation || "À définir"}</span>
              )}
            </p>
            <p>
              <span className="font-medium">Horaires de l'intervention :</span>{" "}
              {editing ? (
                <EditableTextArea value={eventTime} onChange={setEventTime} placeholder="À définir" rows={2} />
              ) : (
                <span className="whitespace-pre-line">{eventTime || "À définir"}</span>
              )}
            </p>
            <p>
              <span className="font-medium">Auditoire :</span>{" "}
              <Field editing={editing} value={eventAudience} onChange={setEventAudience} placeholder="À définir" />
            </p>
            <p>
              <span className="font-medium">Thématique :</span>{" "}
              <Field editing={editing} value={eventTheme} onChange={setEventTheme} placeholder="À définir" />
            </p>
            <p>
              <span className="font-medium">Arrivée du conférencier sur place :</span>{" "}
              <Field editing={editing} value={eventArrival} onChange={setEventArrival} placeholder="À confirmer" />
            </p>
          </div>
        </section>

        {/* Besoins logistiques */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-3">Besoins logistiques :</h3>
          {editing ? (
            <TextArea
              editing={editing}
              value={eventTechNeeds}
              onChange={setEventTechNeeds}
              placeholder="Vidéoprojecteur, micro HF, pupitre, eau, configuration de salle…"
              rows={6}
            />
          ) : eventTechNeeds ? (
            <ul className="list-disc pl-5 space-y-1">
              {eventTechNeeds
                .split(/[,\n]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
            </ul>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              <li>Vidéoprojecteur</li>
              <li>Micro HF</li>
            </ul>
          )}
        </section>



        {/* Contact */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-3">Contact :</h3>
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Contact client :</span>
            <span>{proposal?.recipient_name || "—"}</span>
            <span>-</span>
            {editing ? (
              <EditableField value={clientPhone} onChange={setClientPhone} type="tel" placeholder="Téléphone" />
            ) : (
              <span>{clientPhone || "À définir"}</span>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-medium">Contact conférencier :</span>
            <span>{speaker?.name || "—"}</span>
            <span>-</span>
            {editing ? (
              <EditableField value={speakerPhone} onChange={setSpeakerPhone} type="tel" placeholder="Téléphone" />
            ) : (
              <span>{speakerPhone || "À définir"}</span>
            )}
          </p>
        </section>


        {/* Commentaires */}
        <section className="mb-8">
          <h3 className="font-bold text-lg mb-3">Commentaires :</h3>
          {editing ? (
            <TextArea editing={editing} value={eventNotes} onChange={setEventNotes} placeholder="Commentaires libres…" rows={4} />
          ) : (
            <p className="whitespace-pre-line">{eventNotes || contract?.event_description || "—"}</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default LiaisonSheetView;
