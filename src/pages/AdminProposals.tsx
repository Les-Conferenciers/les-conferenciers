import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Send, Trash2, ExternalLink, Copy, Check, User } from "lucide-react";
import { toast } from "sonner";

type SpeakerConference = { id: string; title: string; speaker_id: string };
type Speaker = { id: string; name: string; image_url: string | null; role: string | null; themes: string[] | null; base_fee: number | null; city: string | null };
type ProposalSpeaker = {
  speaker_id: string;
  speaker_fee: number | null;
  travel_costs: number | null;
  agency_commission: number | null;
  total_price: number | null;
  display_order: number;
  selected_conference_ids: string[];
};

type Proposal = {
  id: string;
  token: string;
  client_name: string;
  client_email: string;
  message: string | null;
  recipient_name: string | null;
  status: string;
  sent_at: string | null;
  expires_at: string;
  created_at: string;
  proposal_speakers: {
    speaker_id: string;
    speaker_fee: number | null;
    travel_costs: number | null;
    agency_commission: number | null;
    total_price: number | null;
    speakers: { name: string; image_url: string | null } | null;
  }[];
};

const COMMISSION = 1000;

const AdminProposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [conferences, setConferences] = useState<SpeakerConference[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSpeakers, setSelectedSpeakers] = useState<ProposalSpeaker[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      await Promise.all([fetchProposals(), fetchSpeakers(), fetchConferences()]);
    };
    init();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("proposals")
      .select("*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, speakers(name, image_url))")
      .order("created_at", { ascending: false });
    setProposals((data as any) || []);
    setLoading(false);
  };

  const fetchSpeakers = async () => {
    const { data } = await supabase
      .from("speakers")
      .select("id, name, image_url, role, themes, base_fee, city")
      .order("name");
    setSpeakers(data || []);
  };

  const fetchConferences = async () => {
    const { data, error } = await supabase
      .from("speaker_conferences")
      .select("id, title, speaker_id")
      .order("display_order");
    if (error) {
      console.error("Erreur chargement conférences:", error);
    }
    console.log("Conférences chargées:", data?.length ?? 0);
    setConferences(data || []);
  };

  const getConferencesForSpeaker = (speakerId: string) =>
    conferences.filter(c => c.speaker_id === speakerId);

  const addSpeaker = (speaker: Speaker) => {
    if (selectedSpeakers.length >= 3) { toast.error("Maximum 3 conférenciers"); return; }
    if (selectedSpeakers.find(s => s.speaker_id === speaker.id)) { toast.error("Déjà ajouté"); return; }

    const baseFee = speaker.base_fee ?? 0;
    const commission = COMMISSION;
    const totalPrice = baseFee + commission;

    setSelectedSpeakers(prev => [...prev, {
      speaker_id: speaker.id,
      speaker_fee: baseFee || null,
      travel_costs: null,
      agency_commission: commission,
      total_price: totalPrice || null,
      display_order: prev.length,
      selected_conference_ids: [],
    }]);
  };

  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakers(prev => prev.filter(s => s.speaker_id !== speakerId));
  };

  const toggleConference = (speakerId: string, confId: string) => {
    setSelectedSpeakers(prev => prev.map(s => {
      if (s.speaker_id !== speakerId) return s;
      const ids = s.selected_conference_ids.includes(confId)
        ? s.selected_conference_ids.filter(id => id !== confId)
        : [...s.selected_conference_ids, confId];
      return { ...s, selected_conference_ids: ids };
    }));
  };

  const updateSpeakerField = (speakerId: string, field: keyof ProposalSpeaker, value: number | null) => {
    setSelectedSpeakers(prev => prev.map(s => {
      if (s.speaker_id !== speakerId) return s;
      const updated = { ...s, [field]: value };
      if (field !== "total_price" && field !== "display_order" && field !== "selected_conference_ids") {
        const fee = field === "speaker_fee" ? value : updated.speaker_fee;
        const travel = field === "travel_costs" ? value : updated.travel_costs;
        const commission = field === "agency_commission" ? value : updated.agency_commission;
        updated.total_price = (fee || 0) + (travel || 0) + (commission || 0) || null;
      }
      return updated;
    }));
  };

  const getSpeakerName = (id: string) => speakers.find(s => s.id === id)?.name || "—";
  const getSpeakerImage = (id: string) => speakers.find(s => s.id === id)?.image_url || null;
  const getSpeakerCity = (id: string) => speakers.find(s => s.id === id)?.city || null;

  const handleCreate = async () => {
    if (!clientName || !clientEmail || selectedSpeakers.length === 0) {
      toast.error("Remplissez le nom, email et ajoutez au moins 1 conférencier");
      return;
    }
    setSubmitting(true);

    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({
        client_name: clientName,
        client_email: clientEmail,
        message: message || null,
        recipient_name: recipientName || null,
      })
      .select()
      .single();

    if (error || !proposal) { toast.error("Erreur création"); setSubmitting(false); return; }

    const { error: spError } = await supabase
      .from("proposal_speakers")
      .insert(selectedSpeakers.map((s, i) => ({
        proposal_id: proposal.id,
        speaker_id: s.speaker_id,
        speaker_fee: s.speaker_fee,
        travel_costs: s.travel_costs,
        agency_commission: s.agency_commission,
        total_price: s.total_price,
        display_order: i,
        selected_conference_ids: s.selected_conference_ids.length > 0 ? s.selected_conference_ids : null,
      })));

    if (spError) { toast.error("Erreur ajout speakers"); setSubmitting(false); return; }

    toast.success("Proposition créée !");
    setDialogOpen(false);
    resetForm();
    fetchProposals();
    setSubmitting(false);
  };

  const resetForm = () => {
    setClientName(""); setClientEmail(""); setMessage(""); setRecipientName(""); setSelectedSpeakers([]);
  };

  const handleSend = async (proposal: Proposal) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-email", {
        body: { proposal_id: proposal.id },
      });
      if (error) throw error;

      await supabase.from("proposals").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", proposal.id);
      toast.success("Email envoyé !");
      fetchProposals();
    } catch {
      toast.error("Erreur d'envoi");
    }
    setSending(null);
  };

  const getProposalUrl = (token: string) => `${window.location.origin}/proposition/${token}`;

  const copyLink = (proposal: Proposal) => {
    navigator.clipboard.writeText(getProposalUrl(proposal.token));
    setCopiedId(proposal.id);
    toast.success("Lien copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-serif font-bold text-foreground">Propositions</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Nouvelle proposition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Créer une proposition</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Société / Nom du client</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="SNCF" />
                </div>
                <div className="space-y-2">
                  <Label>Email du client</Label>
                  <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@societe.com" />
                </div>
              </div>

              {/* Recipient name */}
              <div className="space-y-2">
                <Label>Prénom Nom du destinataire (optionnel)</Label>
                <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Pascal DUPONT" />
                <p className="text-[11px] text-muted-foreground">
                  Affiché en titre : « Votre proposition personnalisée — {recipientName || "Prénom Nom"} pour {clientName || "Société"} »
                </p>
              </div>

              <div className="space-y-2">
                <Label>Message personnalisé (optionnel)</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Bonjour, suite à notre échange..." rows={3} />
              </div>

              {/* Speaker selection */}
              <div className="space-y-3">
                <Label>Conférenciers ({selectedSpeakers.length}/3)</Label>
                {selectedSpeakers.map(ps => {
                  const city = getSpeakerCity(ps.speaker_id);
                  const imageUrl = getSpeakerImage(ps.speaker_id);
                  const speakerConfs = getConferencesForSpeaker(ps.speaker_id);
                  return (
                    <div key={ps.speaker_id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Medallion photo */}
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={getSpeakerName(ps.speaker_id)} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{getSpeakerName(ps.speaker_id)}</span>
                            {city && <span className="text-xs text-muted-foreground ml-2">📍 {city}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeSpeaker(ps.speaker_id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Conference selection */}
                      {speakerConfs.length > 0 && (
                        <div className="space-y-2 bg-muted/50 rounded-md p-3">
                          <Label className="text-xs text-muted-foreground">Conférences à inclure</Label>
                          {speakerConfs.map(conf => (
                            <div key={conf.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`conf-${conf.id}`}
                                checked={ps.selected_conference_ids.includes(conf.id)}
                                onCheckedChange={() => toggleConference(ps.speaker_id, conf.id)}
                              />
                              <label htmlFor={`conf-${conf.id}`} className="text-sm cursor-pointer leading-tight">
                                {conf.title}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Cachet conférencier (€)</Label>
                          <Input type="number" placeholder="0" value={ps.speaker_fee ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "speaker_fee", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label>
                          <Input type="number" placeholder="0" value={ps.travel_costs ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "travel_costs", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Commission agence (€)</Label>
                          <Input type="number" placeholder="1000" value={ps.agency_commission ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "agency_commission", e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Prix total TTC (€) — auto-calculé</Label>
                          <Input type="number" value={ps.total_price ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "total_price", e.target.value ? Number(e.target.value) : null)} className="font-bold" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Tarif de base en BDD : {speakers.find(s => s.id === ps.speaker_id)?.base_fee?.toLocaleString("fr-FR") ?? "non renseigné"} € · Commission auto : +{COMMISSION.toLocaleString("fr-FR")} €
                      </p>
                    </div>
                  );
                })}
                {selectedSpeakers.length < 3 && (
                  <div className="border border-dashed border-border rounded-lg p-3">
                    <Label className="text-xs text-muted-foreground mb-2 block">Ajouter un conférencier</Label>
                    <select
                      className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
                      value=""
                      onChange={e => {
                        const sp = speakers.find(s => s.id === e.target.value);
                        if (sp) addSpeaker(sp);
                      }}
                    >
                      <option value="">Sélectionner…</option>
                      {speakers
                        .filter(s => !selectedSpeakers.find(ps => ps.speaker_id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.base_fee ? ` — ${s.base_fee.toLocaleString("fr-FR")} €` : ""}{s.city ? ` (${s.city})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Création…" : "Créer la proposition"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="p-6">
        <p className="text-muted-foreground text-sm mb-4">{proposals.length} proposition{proposals.length !== 1 ? "s" : ""}</p>
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Conférenciers</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map(p => (
                <TableRow key={p.id} className={isExpired(p.expires_at) ? "opacity-50" : ""}>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.client_name}</div>
                    <div className="text-xs text-muted-foreground">{p.client_email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {p.proposal_speakers?.map((ps, i) => {
                        const speaker = ps.speakers as any;
                        if (!speaker) return null;
                        return (
                          <div key={i} className="flex items-center gap-1.5" title={speaker.name}>
                            <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              {speaker.image_url ? (
                                <img src={speaker.image_url} alt={speaker.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-foreground whitespace-nowrap">{speaker.name}</span>
                            {i < (p.proposal_speakers?.length || 0) - 1 && <span className="text-muted-foreground text-xs">·</span>}
                          </div>
                        );
                      })}
                      {(!p.proposal_speakers || p.proposal_speakers.length === 0) && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isExpired(p.expires_at)
                        ? "bg-destructive/10 text-destructive"
                        : p.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isExpired(p.expires_at) ? "Expiré" : p.status === "sent" ? "Envoyé" : "Brouillon"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(p.expires_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => copyLink(p)} title="Copier le lien">
                        {copiedId === p.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" asChild title="Voir en ligne">
                        <a href={getProposalUrl(p.token)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleSend(p)}
                        disabled={sending === p.id}
                      >
                        <Send className="h-3 w-3" />
                        {sending === p.id ? "Envoi…" : "Envoyer"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {proposals.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Aucune proposition pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default AdminProposals;