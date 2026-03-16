import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, FileText, Mic, Building2 } from "lucide-react";
import nugget from "@/assets/nugget.png";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminSpeakersCRM from "@/components/admin/AdminSpeakersCRM";
import AdminClients from "@/components/admin/AdminClients";

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authed, setAuthed] = useState(false);

  const tab = searchParams.get("tab") || "speakers";

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      setAuthed(true);
    };
    check();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const setTab = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={nugget} alt="" className="h-6 w-6" />
          <h1 className="text-xl font-serif font-bold text-foreground">Administration</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </header>

      <div className="p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="speakers" className="gap-2">
              <Mic className="h-4 w-4" /> CRM Speakers
            </TabsTrigger>
            <TabsTrigger value="propositions" className="gap-2">
              <FileText className="h-4 w-4" /> Propositions
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Building2 className="h-4 w-4" /> Clients
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" /> Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="speakers">
            <AdminSpeakersCRM />
          </TabsContent>

          <TabsContent value="propositions">
            <AdminProposalsContent />
          </TabsContent>

          <TabsContent value="clients">
            <AdminClients />
          </TabsContent>

          <TabsContent value="leads">
            <AdminLeads />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ── Inline Proposals content ──
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
import { Plus, Send, Trash2, ExternalLink, Copy, Check, RefreshCw, Archive, User, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import EventDossier from "@/components/admin/EventDossier";
import { toast } from "sonner";

const getDefaultMessage = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},

Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.

Vous trouverez ci-joint un fichier PDF présentant une sélection de conférenciers, sous réserve de leur disponibilité.

Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.

Je reste bien entendu à votre disposition pour tout complément d'information. Et si aucun de ces profils ne correspondait pleinement à vos attentes, nous pourrions poursuivre ensemble les recherches afin d'identifier l'intervenant idéal.

Dans l'attente de votre retour, je vous souhaite une très belle journée.

Nelly Sabde — Les Conférenciers`;

const getDefaultEmailSubject = (clientName: string) =>
  `Votre sélection de conférenciers sur mesure — ${clientName || "Les Conférenciers"}`;

const getDefaultEmailBody = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},

Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.

Vous trouverez ci-dessous une sélection de conférenciers soigneusement choisis pour ${clientName || "votre événement"}, sous réserve de leur disponibilité.

Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.

👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.

Je reste bien entendu à votre disposition pour tout complément d'information.

Dans l'attente de votre retour, je vous souhaite une très belle journée.

Nelly Sabde — Les Conférenciers
📞 06 XX XX XX XX`;

type SpeakerConference = { id: string; title: string; speaker_id: string };
type Speaker = { id: string; name: string; image_url: string | null; role: string | null; themes: string[] | null; base_fee: number | null; city: string | null; formal_address?: boolean; email?: string | null; phone?: string | null };
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
  client_id: string | null;
  email_subject: string | null;
  email_body: string | null;
  status: string;
  sent_at: string | null;
  expires_at: string;
  created_at: string;
  reminder1_sent_at?: string | null;
  reminder2_sent_at?: string | null;
  proposal_speakers: {
    speaker_id: string;
    speaker_fee: number | null;
    travel_costs: number | null;
    agency_commission: number | null;
    total_price: number | null;
    speakers: { name: string; image_url: string | null; formal_address?: boolean; email?: string | null; phone?: string | null } | null;
  }[];
};

const COMMISSION = 1300;

type ContractData = { id: string; proposal_id: string; status: string };
type InvoiceData = { id: string; proposal_id: string; invoice_type: string; status: string; paid_at: string | null };

const AdminProposalsContent = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [conferences, setConferences] = useState<SpeakerConference[]>([]);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState(getDefaultMessage("", ""));
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedSpeakers, setSelectedSpeakers] = useState<ProposalSpeaker[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineTab, setPipelineTab] = useState("drafts");
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editEmailSubject, setEditEmailSubject] = useState("");
  const [editEmailBody, setEditEmailBody] = useState("");

  useEffect(() => {
    Promise.all([fetchProposals(), fetchSpeakers(), fetchConferences()]);
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    const [proposalsRes, contractsRes, invoicesRes] = await Promise.all([
      supabase
        .from("proposals")
        .select("*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, speakers(name, image_url, formal_address, email, phone))")
        .order("created_at", { ascending: false }),
      supabase.from("contracts").select("id, proposal_id, status"),
      supabase.from("invoices").select("id, proposal_id, invoice_type, status, paid_at"),
    ]);
    setProposals((proposalsRes.data as any) || []);
    setContracts((contractsRes.data as any) || []);
    setAllInvoices((invoicesRes.data as any) || []);
    setLoading(false);
  };

  const fetchSpeakers = async () => {
    const { data } = await supabase.from("speakers").select("id, name, image_url, role, themes, base_fee, city, formal_address, email, phone").order("name");
    setSpeakers(data || []);
  };

  const fetchConferences = async () => {
    const { data } = await supabase.from("speaker_conferences").select("id, title, speaker_id").order("display_order");
    setConferences(data || []);
  };

  const getPipelineStatus = (p: Proposal) => {
    const pInvoices = allInvoices.filter(i => i.proposal_id === p.id);
    const pContract = contracts.find(c => c.proposal_id === p.id);
    const allPaid = pInvoices.length > 0 && pInvoices.every(i => i.status === "paid");
    const somePaid = pInvoices.some(i => i.status === "paid");
    const hasAcompteSent = pInvoices.some(i => i.invoice_type === "acompte" && (i.status === "sent" || i.status === "paid"));
    const hasAcompte = pInvoices.some(i => i.invoice_type === "acompte");
    if (allPaid && pInvoices.length > 0) return "fully_paid";
    if (somePaid) return "partial_paid";
    if (hasAcompteSent) return "acompte_sent";
    if (hasAcompte) return "acompte_created";
    if (pContract) return "contrat_sent";
    return "accepted";
  };

  const isFullyPaid = (p: Proposal) => getPipelineStatus(p) === "fully_paid";

  const drafts = proposals.filter(p => p.status === "draft");
  const sent = proposals.filter(p => (p.status === "sent" || p.status === "accepted") && !isFullyPaid(p));
  const completed = proposals.filter(p => p.status === "accepted" && isFullyPaid(p));
  const archived = proposals.filter(p => p.status === "archived");

  const getConferencesForSpeaker = (speakerId: string) => conferences.filter(c => c.speaker_id === speakerId);

  const addSpeaker = (speaker: Speaker) => {
    if (selectedSpeakers.length >= 3) { toast.error("Maximum 3 conférenciers"); return; }
    if (selectedSpeakers.find(s => s.speaker_id === speaker.id)) { toast.error("Déjà ajouté"); return; }
    const baseFee = speaker.base_fee ?? 0;
    setSelectedSpeakers(prev => [...prev, {
      speaker_id: speaker.id, speaker_fee: baseFee || null, travel_costs: 0,
      agency_commission: COMMISSION, total_price: (baseFee + COMMISSION) || null,
      display_order: prev.length, selected_conference_ids: [],
    }]);
  };

  const removeSpeaker = (speakerId: string) => setSelectedSpeakers(prev => prev.filter(s => s.speaker_id !== speakerId));

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
        const comm = field === "agency_commission" ? value : updated.agency_commission;
        updated.total_price = (fee || 0) + (travel || 0) + (comm || 0) || null;
      }
      return updated;
    }));
  };

  const getSpeakerName = (id: string) => speakers.find(s => s.id === id)?.name || "—";
  const getSpeakerImage = (id: string) => speakers.find(s => s.id === id)?.image_url || null;
  const getSpeakerCity = (id: string) => speakers.find(s => s.id === id)?.city || null;

  const handleCreate = async () => {
    if (!clientName || !clientEmail || selectedSpeakers.length === 0) {
      toast.error("Remplissez le nom, email et ajoutez au moins 1 conférencier"); return;
    }
    setSubmitting(true);
    const finalMessage = message || getDefaultMessage(recipientName, clientName);
    const finalSubject = emailSubject || getDefaultEmailSubject(clientName);
    const finalBody = emailBody || getDefaultEmailBody(recipientName, clientName);
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({ client_name: clientName, client_email: clientEmail, message: finalMessage, recipient_name: recipientName || null, email_subject: finalSubject, email_body: finalBody } as any)
      .select().single();
    if (error || !proposal) { toast.error("Erreur création"); setSubmitting(false); return; }
    const { error: spError } = await supabase
      .from("proposal_speakers")
      .insert(selectedSpeakers.map((s, i) => ({
        proposal_id: proposal.id, speaker_id: s.speaker_id, speaker_fee: s.speaker_fee,
        travel_costs: s.travel_costs, agency_commission: s.agency_commission, total_price: s.total_price,
        display_order: i, selected_conference_ids: s.selected_conference_ids.length > 0 ? s.selected_conference_ids : null,
      })));
    if (spError) { toast.error("Erreur ajout speakers"); setSubmitting(false); return; }
    toast.success("Proposition créée !");
    setDialogOpen(false); resetForm(); fetchProposals(); setSubmitting(false);
  };

  const resetForm = () => {
    setClientName(""); setClientEmail(""); setRecipientName(""); setSelectedSpeakers([]);
    setEmailSubject(""); setEmailBody(""); setMessage("");
  };

  const openEditDialog = (p: Proposal) => {
    setEditingProposal(p);
    setEditClientName(p.client_name); setEditClientEmail(p.client_email);
    setEditRecipientName(p.recipient_name || "");
    setEditMessage(p.message || getDefaultMessage(p.recipient_name || "", p.client_name));
    setEditEmailSubject(p.email_subject || getDefaultEmailSubject(p.client_name));
    setEditEmailBody(p.email_body || getDefaultEmailBody(p.recipient_name || "", p.client_name));
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProposal) return;
    setSubmitting(true);
    const { error } = await supabase.from("proposals").update({
      client_name: editClientName, client_email: editClientEmail,
      recipient_name: editRecipientName || null, message: editMessage || null,
      email_subject: editEmailSubject || null, email_body: editEmailBody || null,
    } as any).eq("id", editingProposal.id);
    if (error) { toast.error("Erreur"); setSubmitting(false); return; }
    toast.success("Proposition mise à jour !");
    setEditDialogOpen(false); setEditingProposal(null); fetchProposals(); setSubmitting(false);
  };

  const handleSend = async (proposal: Proposal) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-email", { body: { proposal_id: proposal.id } });
      if (error) throw error;
      await supabase.from("proposals").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", proposal.id);
      toast.success("Email envoyé !"); fetchProposals();
    } catch { toast.error("Erreur d'envoi"); }
    setSending(null);
  };

  const handleReminder = async (proposal: Proposal, reminderNum: 1 | 2) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-reminder", {
        body: { proposal_id: proposal.id, reminder_number: reminderNum },
      });
      if (error) throw error;
      const field = reminderNum === 1 ? "reminder1_sent_at" : "reminder2_sent_at";
      await supabase.from("proposals").update({ [field]: new Date().toISOString() } as any).eq("id", proposal.id);
      toast.success(`Relance ${reminderNum} envoyée !`);
      fetchProposals();
    } catch { toast.error("Erreur d'envoi de relance"); }
    setSending(null);
  };

  const handleAccept = async (id: string) => {
    await supabase.from("proposals").update({ status: "accepted" }).eq("id", id);
    toast.success("Proposition passée en « Accepté »"); fetchProposals();
  };

  const handleArchive = async (id: string) => {
    await supabase.from("proposals").update({ status: "archived" }).eq("id", id);
    toast.success("Proposition archivée"); fetchProposals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette proposition ?")) return;
    await supabase.from("proposal_speakers").delete().eq("proposal_id", id);
    await supabase.from("proposals").delete().eq("id", id);
    toast.success("Proposition supprimée"); fetchProposals();
  };

  const getProposalUrl = (token: string) => `${window.location.origin}/proposition/${token}`;
  const copyLink = (proposal: Proposal) => {
    navigator.clipboard.writeText(getProposalUrl(proposal.token));
    setCopiedId(proposal.id); toast.success("Lien copié !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const getRemainingDays = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPipelineLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      accepted: { label: "Accepté", color: "bg-blue-100 text-blue-700" },
      contrat_sent: { label: "Contrat créé", color: "bg-indigo-100 text-indigo-700" },
      acompte_created: { label: "Acompte créé", color: "bg-amber-100 text-amber-700" },
      acompte_sent: { label: "Acompte envoyé", color: "bg-orange-100 text-orange-700" },
      partial_paid: { label: "Payé partiellement", color: "bg-yellow-100 text-yellow-700" },
      fully_paid: { label: "Payé 100%", color: "bg-green-100 text-green-700" },
    };
    return map[status] || { label: status, color: "bg-muted text-muted-foreground" };
  };

  const renderSpeakerForm = () => (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Société / Nom du client</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="SNCF" /></div>
        <div className="space-y-2"><Label>Email du client</Label><Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@societe.com" /></div>
      </div>
      <div className="space-y-2">
        <Label>Prénom Nom du destinataire (optionnel)</Label>
        <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Pascal DUPONT" />
        <p className="text-[11px] text-muted-foreground">Affiché en titre : « {recipientName || "Prénom Nom"} pour {clientName || "Société"} »</p>
      </div>
      <div className="space-y-2">
        <Label>Message personnalisé (affiché sur la page proposition)</Label>
        <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="text-sm" />
      </div>
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
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {imageUrl ? <img src={imageUrl} alt={getSpeakerName(ps.speaker_id)} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{getSpeakerName(ps.speaker_id)}</span>
                    {city && <span className="text-xs text-muted-foreground ml-2">📍 {city}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeSpeaker(ps.speaker_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              {speakerConfs.length > 0 && (
                <div className="space-y-2 bg-muted/50 rounded-md p-3">
                  <Label className="text-xs text-muted-foreground">Conférences à inclure</Label>
                  {speakerConfs.map(conf => (
                    <div key={conf.id} className="flex items-center gap-2">
                      <Checkbox id={`conf-${conf.id}`} checked={ps.selected_conference_ids.includes(conf.id)} onCheckedChange={() => toggleConference(ps.speaker_id, conf.id)} />
                      <label htmlFor={`conf-${conf.id}`} className="text-sm cursor-pointer leading-tight">{conf.title}</label>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Cachet conférencier (€)</Label><Input type="number" placeholder="0" value={ps.speaker_fee ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "speaker_fee", e.target.value ? Number(e.target.value) : null)} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label><Input type="number" placeholder="0" value={ps.travel_costs ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "travel_costs", e.target.value ? Number(e.target.value) : null)} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Commission agence (€)</Label><Input type="number" placeholder="1000" value={ps.agency_commission ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "agency_commission", e.target.value ? Number(e.target.value) : null)} /></div>
                <div className="space-y-1"><Label className="text-xs text-muted-foreground">Prix total TTC (€)</Label><Input type="number" value={ps.total_price ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "total_price", e.target.value ? Number(e.target.value) : null)} className="font-bold" /></div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Base BDD : {speakers.find(s => s.id === ps.speaker_id)?.base_fee?.toLocaleString("fr-FR") ?? "—"} € · Commission auto : +{COMMISSION.toLocaleString("fr-FR")} €
              </p>
            </div>
          );
        })}
        {selectedSpeakers.length < 3 && (
          <div className="border border-dashed border-border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground mb-2 block">Ajouter un conférencier</Label>
            <select className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value="" onChange={e => { const sp = speakers.find(s => s.id === e.target.value); if (sp) addSpeaker(sp); }}>
              <option value="">Sélectionner…</option>
              {speakers.filter(s => !selectedSpeakers.find(ps => ps.speaker_id === s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.base_fee ? ` — ${s.base_fee.toLocaleString("fr-FR")} €` : ""}{s.city ? ` (${s.city})` : ""}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <Button className="w-full" onClick={handleCreate} disabled={submitting}>
        {submitting ? "Création…" : "Créer la proposition"}
      </Button>
    </div>
  );

  const renderProposalRow = (p: Proposal, mode: "draft" | "sent" | "completed") => {
    const remaining = getRemainingDays(p.expires_at);
    const expired = isExpired(p.expires_at);
    const pipelineStatus = p.status === "accepted" ? getPipelineStatus(p) : null;
    const pipelineInfo = pipelineStatus ? getPipelineLabel(pipelineStatus) : null;

    return (
      <React.Fragment key={p.id}>
        <TableRow className={expired && mode !== "completed" ? "opacity-50" : ""}>
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
                      {speaker.image_url ? <img src={speaker.image_url} alt={speaker.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><User className="h-3.5 w-3.5 text-muted-foreground" /></div>}
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
            {mode === "draft" && <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Brouillon</span>}
            {mode === "sent" && p.status === "sent" && (
              <div className="space-y-1">
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">En attente</span>
                {!expired && <div className="text-[10px] text-muted-foreground">{remaining}j restants</div>}
                {expired && <span className="text-[10px] text-destructive font-medium">Expiré</span>}
                {/* Reminder badges */}
                {(p as any).reminder1_sent_at && <div className="text-[10px] text-blue-600">Relance 1 ✓</div>}
                {(p as any).reminder2_sent_at && <div className="text-[10px] text-blue-600">Relance 2 ✓</div>}
              </div>
            )}
            {mode === "sent" && p.status === "accepted" && pipelineInfo && (
              <span className={`text-xs px-2 py-1 rounded-full ${pipelineInfo.color}`}>{pipelineInfo.label}</span>
            )}
            {mode === "completed" && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">✓ Mission terminée</span>}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1 flex-wrap">
              {(p.status === "accepted" && (mode === "sent" || mode === "completed")) && (
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} title="Dossier événement">
                  {expandedId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => copyLink(p)} title="Copier le lien">
                {copiedId === p.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" asChild title="Voir en ligne">
                <a href={getProposalUrl(p.token)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
              </Button>
              {(mode === "draft" || (mode === "sent" && p.status === "sent")) && (
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)} title="Éditer"><Pencil className="h-4 w-4" /></Button>
              )}
              {mode === "draft" && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleSend(p)} disabled={sending === p.id}>
                  <Send className="h-3 w-3" />{sending === p.id ? "Envoi…" : "Envoyer"}
                </Button>
              )}
              {mode === "sent" && p.status === "sent" && (
                <>
                  {!expired && !(p as any).reminder1_sent_at && (
                    <Button variant="outline" size="sm" className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleReminder(p, 1)} disabled={sending === p.id} title="Relance 1">
                      <RefreshCw className="h-3 w-3" /> Relance 1
                    </Button>
                  )}
                  {!expired && (p as any).reminder1_sent_at && !(p as any).reminder2_sent_at && (
                    <Button variant="outline" size="sm" className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleReminder(p, 2)} disabled={sending === p.id} title="Relance 2">
                      <RefreshCw className="h-3 w-3" /> Relance 2
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleAccept(p.id)} title="Accepter">
                    <Check className="h-3 w-3" /> Accepter
                  </Button>
                </>
              )}
              {mode !== "completed" && p.status !== "archived" && (
                <Button variant="ghost" size="sm" onClick={() => handleArchive(p.id)} title="Archiver"><Archive className="h-4 w-4 text-muted-foreground" /></Button>
              )}
              {mode === "draft" && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} title="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              )}
            </div>
          </TableCell>
        </TableRow>
        {expandedId === p.id && p.status === "accepted" && (
          <TableRow>
            <TableCell colSpan={5} className="bg-muted/30 px-6 py-2">
              <EventDossier
                proposal={{
                  id: p.id, client_name: p.client_name, client_email: p.client_email,
                  recipient_name: p.recipient_name, client_id: p.client_id || null, status: p.status,
                  proposal_speakers: (p.proposal_speakers || []).map((ps: any) => ({
                    speaker_id: ps.speaker_id,
                    speaker_fee: ps.speaker_fee, travel_costs: ps.travel_costs,
                    agency_commission: ps.agency_commission, total_price: ps.total_price,
                    speakers: ps.speakers,
                  })),
                }}
                onUpdate={fetchProposals}
              />
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  const renderTable = (items: Proposal[], mode: "draft" | "sent" | "completed") => (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Conférenciers</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(p => renderProposalRow(p, mode))}
          {items.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                {mode === "draft" && "Aucun brouillon."}
                {mode === "sent" && "Aucune proposition envoyée."}
                {mode === "completed" && "Aucune mission terminée."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground text-sm">{proposals.length} proposition{proposals.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchProposals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" /> Nouvelle proposition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-serif">Créer une proposition</DialogTitle></DialogHeader>
              {renderSpeakerForm()}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={pipelineTab} onValueChange={setPipelineTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="drafts" className="gap-1.5 text-xs">
            📝 Brouillons {drafts.length > 0 && <span className="ml-1 bg-muted-foreground/20 text-muted-foreground rounded-full px-1.5 text-[10px]">{drafts.length}</span>}
          </TabsTrigger>
          {/* Envoyées, Terminées et Archivées masquées temporairement */}
        </TabsList>

        <TabsContent value="drafts">{renderTable(drafts, "draft")}</TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Éditer la proposition</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Société / Nom du client</Label><Input value={editClientName} onChange={e => setEditClientName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email du client</Label><Input type="email" value={editClientEmail} onChange={e => setEditClientEmail(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Prénom Nom du destinataire</Label><Input value={editRecipientName} onChange={e => setEditRecipientName(e.target.value)} /></div>
            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-sm mb-3">📄 Message affiché dans la proposition</h3>
              <Textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={8} className="text-sm" />
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-sm mb-3">✉️ Email d'envoi</h3>
              <div className="space-y-3">
                <div className="space-y-2"><Label className="text-xs text-muted-foreground">Objet</Label><Input value={editEmailSubject} onChange={e => setEditEmailSubject(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs text-muted-foreground">Corps du mail</Label><Textarea value={editEmailBody} onChange={e => setEditEmailBody(e.target.value)} rows={10} className="text-sm" /></div>
              </div>
            </div>
            <Button className="w-full" onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? "Sauvegarde…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
