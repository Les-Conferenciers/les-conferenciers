import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Send, Trash2, ExternalLink, Copy, Check, User, Filter, ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import EventDossier from "@/components/admin/EventDossier";
import { cn } from "@/lib/utils";

type SpeakerConference = { id: string; title: string; speaker_id: string };
type Speaker = { id: string; name: string; image_url: string | null; role: string | null; themes: string[] | null; base_fee: number | null; city: string | null };
type ProposalTemplate = { id: string; name: string; speaker_ids: string[]; is_preset: boolean };
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
  status: string;
  sent_at: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  proposal_speakers: {
    speaker_id: string;
    speaker_fee: number | null;
    travel_costs: number | null;
    agency_commission: number | null;
    total_price: number | null;
    speakers: { name: string; image_url: string | null; formal_address?: boolean; phone?: string; email?: string } | null;
  }[];
};

type EventData = {
  id: string;
  proposal_id: string;
  info_sent_speaker_at: string | null;
  contract_sent_speaker_at: string | null;
  visio_date: string | null;
  liaison_sheet_sent_at: string | null;
  speaker_paid_at: string | null;
  selected_speaker_id: string | null;
};

type ContractData = {
  id: string;
  proposal_id: string;
  status: string;
  signed_at: string | null;
};

type InvoiceData = {
  id: string;
  proposal_id: string;
  invoice_type: string;
  status: string;
  sent_at: string | null;
  paid_at: string | null;
};

const COMMISSION = 1000;
const TEMPLATE_ICON = "📋";
// Step definitions for the pipeline
const PIPELINE_STEPS = [
  { key: "proposal_sent", label: "Proposition envoyée" },
  { key: "proposal_accepted", label: "Proposition acceptée" },
  { key: "contract_sent", label: "Contrat envoyé" },
  { key: "contract_signed", label: "Contrat signé" },
  { key: "info_speaker", label: "Info conférencier" },
  { key: "deposit_invoice", label: "Facture acompte" },
  { key: "visio", label: "Visio prépa" },
  { key: "liaison", label: "Feuille liaison" },
  { key: "final_invoice", label: "Facture finale" },
  { key: "speaker_paid", label: "Conf. payé" },
];

const AdminProposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [conferences, setConferences] = useState<SpeakerConference[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sent");
  const [stepFilter, setStepFilter] = useState<string | null>(null);
  const [saveTemplateName, setSaveTemplateName] = useState("");

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [eventCity, setEventCity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [isEnglish, setIsEnglish] = useState(false);
  const defaultMessage = `Bonjour,

Suite à notre échange, j'ai le plaisir de vous adresser une sélection de conférenciers correspondant à vos attentes.

Vous trouverez ci-dessous leurs profils détaillés ainsi que les thématiques de conférences qu'ils proposent.

N'hésitez pas à revenir vers moi pour toute question ou pour organiser un échange.

Belle journée,`;
  const [message, setMessage] = useState(defaultMessage);
  const [selectedSpeakers, setSelectedSpeakers] = useState<ProposalSpeaker[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      await fetchAll();
    };
    init();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [propRes, spkRes, confRes, evtRes, ctrRes, invRes, tplRes] = await Promise.all([
      supabase.from("proposals").select("*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, speakers(name, image_url, formal_address, phone, email))").order("created_at", { ascending: false }),
      supabase.from("speakers").select("id, name, image_url, role, themes, base_fee, city").order("name"),
      supabase.from("speaker_conferences").select("id, title, speaker_id").order("display_order"),
      supabase.from("events").select("id, proposal_id, info_sent_speaker_at, contract_sent_speaker_at, visio_date, liaison_sheet_sent_at, speaker_paid_at, selected_speaker_id"),
      supabase.from("contracts").select("id, proposal_id, status, signed_at"),
      supabase.from("invoices").select("id, proposal_id, invoice_type, status, sent_at, paid_at"),
      supabase.from("proposal_templates").select("*").order("is_preset", { ascending: false }).order("name"),
    ]);
    setProposals((propRes.data as any) || []);
    setSpeakers(spkRes.data || []);
    setConferences(confRes.data || []);
    setEvents((evtRes.data as any) || []);
    setContracts((ctrRes.data as any) || []);
    setInvoices((invRes.data as any) || []);
    setTemplates((tplRes.data as any) || []);
    setLoading(false);
  };

  // ─── Step resolver for a proposal ───
  const getStepStatus = (p: Proposal) => {
    const evt = events.find(e => e.proposal_id === p.id);
    const ctr = contracts.find(c => c.proposal_id === p.id);
    const propInvoices = invoices.filter(i => i.proposal_id === p.id);
    
    return {
      proposal_sent: !!p.sent_at,
      proposal_accepted: p.status === "accepted" || !!p.accepted_at,
      contract_sent: ctr?.status === "sent" || ctr?.status === "signed",
      contract_signed: ctr?.status === "signed",
      info_speaker: !!evt?.info_sent_speaker_at,
      deposit_invoice: propInvoices.some(i => i.invoice_type === "acompte" && (i.status === "sent" || i.status === "paid")),
      visio: !!evt?.visio_date,
      liaison: !!evt?.liaison_sheet_sent_at,
      final_invoice: propInvoices.some(i => (i.invoice_type === "solde" || i.invoice_type === "total") && (i.status === "sent" || i.status === "paid")),
      speaker_paid: !!evt?.speaker_paid_at,
    };
  };

  const getCompletedSteps = (p: Proposal) => {
    const s = getStepStatus(p);
    return Object.values(s).filter(Boolean).length;
  };

  const getCurrentStep = (p: Proposal): string => {
    const s = getStepStatus(p);
    for (const step of PIPELINE_STEPS) {
      if (!s[step.key as keyof typeof s]) return step.label;
    }
    return "Terminé";
  };

  // ─── Tab classification ───
  const isExpired = (p: Proposal) => new Date(p.expires_at) < new Date();
  const isRefused = (p: Proposal) => p.status === "refused" || (p.status === "sent" && !p.accepted_at && isExpired(p));
  const isAccepted = (p: Proposal) => p.status === "accepted" || !!p.accepted_at;
  const isCompleted = (p: Proposal) => {
    const propInvoices = invoices.filter(i => i.proposal_id === p.id);
    const allPaid = propInvoices.length > 0 && propInvoices.every(i => i.status === "paid");
    return isAccepted(p) && allPaid;
  };

  const drafts = useMemo(() => proposals.filter(p => p.status === "draft"), [proposals]);
  const sentProposals = useMemo(() => proposals.filter(p => {
    if (p.status === "draft") return false;
    if (isRefused(p)) return false;
    if (isCompleted(p)) return false;
    return true;
  }), [proposals, events, contracts, invoices]);
  const refusedProposals = useMemo(() => proposals.filter(p => isRefused(p)), [proposals]);
  const completedProposals = useMemo(() => proposals.filter(p => isCompleted(p)), [proposals, invoices]);

  // Apply step filter
  const filteredSent = useMemo(() => {
    if (!stepFilter) return sentProposals;
    return sentProposals.filter(p => {
      const s = getStepStatus(p);
      const stepKey = stepFilter as keyof typeof s;
      // Show proposals where this step is the current one (not yet done)
      return !s[stepKey];
    });
  }, [sentProposals, stepFilter, events, contracts, invoices]);

  // ─── Speaker helpers ───
  const getConferencesForSpeaker = (speakerId: string) => conferences.filter(c => c.speaker_id === speakerId);
  const addSpeaker = (speaker: Speaker) => {
    if (selectedSpeakers.length >= 3) { toast.error("Maximum 3 conférenciers"); return; }
    if (selectedSpeakers.find(s => s.speaker_id === speaker.id)) { toast.error("Déjà ajouté"); return; }
    const baseFee = speaker.base_fee ?? 0;
    setSelectedSpeakers(prev => [...prev, {
      speaker_id: speaker.id, speaker_fee: baseFee || null, travel_costs: null,
      agency_commission: COMMISSION, total_price: (baseFee + COMMISSION) || null,
      display_order: prev.length, selected_conference_ids: [],
    }]);
  };
  const removeSpeaker = (speakerId: string) => setSelectedSpeakers(prev => prev.filter(s => s.speaker_id !== speakerId));
  const toggleConference = (speakerId: string, confId: string) => {
    setSelectedSpeakers(prev => prev.map(s => {
      if (s.speaker_id !== speakerId) return s;
      const ids = s.selected_conference_ids.includes(confId) ? s.selected_conference_ids.filter(id => id !== confId) : [...s.selected_conference_ids, confId];
      return { ...s, selected_conference_ids: ids };
    }));
  };
  const updateSpeakerField = (speakerId: string, field: keyof ProposalSpeaker, value: number | null) => {
    setSelectedSpeakers(prev => prev.map(s => {
      if (s.speaker_id !== speakerId) return s;
      const updated = { ...s, [field]: value };
      if (field !== "total_price" && field !== "display_order" && field !== "selected_conference_ids") {
        updated.total_price = ((field === "speaker_fee" ? value : updated.speaker_fee) || 0) + ((field === "travel_costs" ? value : updated.travel_costs) || 0) + ((field === "agency_commission" ? value : updated.agency_commission) || 0) || null;
      }
      return updated;
    }));
  };
  const getSpeakerName = (id: string) => speakers.find(s => s.id === id)?.name || "—";
  const getSpeakerImage = (id: string) => speakers.find(s => s.id === id)?.image_url || null;
  const getSpeakerCity = (id: string) => speakers.find(s => s.id === id)?.city || null;

  // ─── Template helpers ───
  const applyTemplate = (tpl: ProposalTemplate) => {
    const tplSpeakers = tpl.speaker_ids
      .map(id => speakers.find(s => s.id === id))
      .filter(Boolean)
      .slice(0, 3) as Speaker[];
    setSelectedSpeakers(tplSpeakers.map((sp, i) => ({
      speaker_id: sp.id,
      speaker_fee: sp.base_fee || null,
      travel_costs: null,
      agency_commission: COMMISSION,
      total_price: ((sp.base_fee || 0) + COMMISSION) || null,
      display_order: i,
      selected_conference_ids: [],
    })));
    toast.success(`Modèle "${tpl.name}" appliqué`);
  };

  const saveAsTemplate = async () => {
    if (!saveTemplateName.trim() || selectedSpeakers.length === 0) {
      toast.error("Donnez un nom et ajoutez au moins 1 conférencier");
      return;
    }
    const { error } = await supabase.from("proposal_templates").insert({
      name: saveTemplateName.trim(),
      speaker_ids: selectedSpeakers.map(s => s.speaker_id),
      is_preset: false,
    } as any);
    if (error) { toast.error("Erreur"); return; }
    toast.success(`Modèle "${saveTemplateName}" sauvegardé !`);
    setSaveTemplateName("");
    fetchAll();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("proposal_templates").delete().eq("id", id);
    toast.success("Modèle supprimé");
    fetchAll();
  };

  // ─── CRUD ───
  const handleCreate = async () => {
    if (!clientName || !clientEmail || selectedSpeakers.length === 0) { toast.error("Remplissez le nom, email et ajoutez au moins 1 conférencier"); return; }
    setSubmitting(true);
    // Build contextual message with event details
    let contextLine = "";
    if (eventCity || eventDate || audienceSize) {
      const parts = [];
      if (eventCity && eventDate) parts.push(`pour votre événement qui aura lieu à ${eventCity} le ${eventDate}`);
      else if (eventCity) parts.push(`pour votre événement à ${eventCity}`);
      else if (eventDate) parts.push(`pour votre événement le ${eventDate}`);
      if (audienceSize) parts.push(`devant un auditoire de ${audienceSize} personnes`);
      contextLine = parts.join(", ");
    }
    if (isEnglish) {
      contextLine = contextLine ? `${contextLine} (intervention en anglais)` : "(intervention en anglais)";
    }
    const finalMessage = contextLine ? `${message}\n\n${contextLine}` : message;
    
    const { data: proposal, error } = await supabase.from("proposals").insert({ client_name: clientName, client_email: clientEmail, message: finalMessage || null, recipient_name: recipientName || null }).select().single();
    if (error || !proposal) { toast.error("Erreur création"); setSubmitting(false); return; }
    await supabase.from("proposal_speakers").insert(selectedSpeakers.map((s, i) => ({
      proposal_id: proposal.id, speaker_id: s.speaker_id, speaker_fee: s.speaker_fee, travel_costs: s.travel_costs,
      agency_commission: s.agency_commission, total_price: s.total_price, display_order: i,
      selected_conference_ids: s.selected_conference_ids.length > 0 ? s.selected_conference_ids : null,
    })));
    toast.success("Proposition créée !"); setDialogOpen(false); resetForm(); fetchAll(); setSubmitting(false);
  };
  const resetForm = () => { setClientName(""); setClientEmail(""); setMessage(defaultMessage); setRecipientName(""); setEventCity(""); setEventDate(""); setAudienceSize(""); setIsEnglish(false); setSelectedSpeakers([]); };

  const handleSend = async (proposal: Proposal) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-email", { body: { proposal_id: proposal.id } });
      if (error) throw error;
      await supabase.from("proposals").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", proposal.id);
      toast.success("Email envoyé !"); fetchAll();
    } catch { toast.error("Erreur d'envoi"); }
    setSending(null);
  };

  const handleAccept = async (p: Proposal) => {
    await supabase.from("proposals").update({ status: "accepted", accepted_at: new Date().toISOString() } as any).eq("id", p.id);
    toast.success("Proposition marquée comme acceptée"); fetchAll();
  };

  const handleRefuse = async (p: Proposal) => {
    await supabase.from("proposals").update({ status: "refused" }).eq("id", p.id);
    toast.success("Proposition marquée comme refusée"); fetchAll();
  };

  const handleReopen = async (p: Proposal) => {
    await supabase.from("proposals").update({ status: "sent", accepted_at: null } as any).eq("id", p.id);
    toast.success("Proposition réouverte"); fetchAll();
  };

  const getProposalUrl = (token: string) => `${window.location.origin}/proposition/${token}`;
  const copyLink = (p: Proposal) => {
    navigator.clipboard.writeText(getProposalUrl(p.token));
    setCopiedId(p.id); toast.success("Lien copié !"); setTimeout(() => setCopiedId(null), 2000);
  };
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  // ─── Step progress bar component ───
  const StepProgress = ({ proposal }: { proposal: Proposal }) => {
    const status = getStepStatus(proposal);
    const totalSteps = PIPELINE_STEPS.length;
    const completed = Object.values(status).filter(Boolean).length;
    const pct = Math.round((completed / totalSteps) * 100);

    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {PIPELINE_STEPS.map((step, i) => {
            const done = status[step.key as keyof typeof status];
            return (
              <div
                key={i}
                title={step.label}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors",
                  done ? "bg-green-500" : "bg-border"
                )}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{pct}%</span>
      </div>
    );
  };

  // ─── Proposal Row ───
  const ProposalRow = ({ p, showActions = true, tab }: { p: Proposal; showActions?: boolean; tab: string }) => {
    const isOpen = expandedId === p.id;
    const accepted = isAccepted(p);

    return (
      <>
        <TableRow
          className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors",
            isOpen && "bg-muted/30"
          )}
          onClick={() => setExpandedId(isOpen ? null : p.id)}
        >
          <TableCell className="w-8">
            {accepted ? (
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
            ) : (
              <div className="w-4" />
            )}
          </TableCell>
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
                        <div className="h-full w-full flex items-center justify-center"><User className="h-3.5 w-3.5 text-muted-foreground" /></div>
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
            {tab === "sent" && accepted && <StepProgress proposal={p} />}
            {tab === "sent" && !accepted && (
              <span className="text-xs text-muted-foreground">{getCurrentStep(p)}</span>
            )}
            {tab === "drafts" && (
              <Badge variant="outline" className="text-[10px]">Brouillon</Badge>
            )}
            {tab === "refused" && (
              <Badge variant="destructive" className="text-[10px]">
                {p.status === "refused" ? "Refusée" : "Expirée"}
              </Badge>
            )}
            {tab === "completed" && (
              <Badge className="text-[10px] bg-green-600">Terminée</Badge>
            )}
          </TableCell>
          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => copyLink(p)} title="Copier le lien">
                {copiedId === p.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" asChild title="Voir en ligne">
                <a href={getProposalUrl(p.token)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
              </Button>
              {tab === "drafts" && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleSend(p)} disabled={sending === p.id}>
                  <Send className="h-3 w-3" /> {sending === p.id ? "Envoi…" : "Envoyer"}
                </Button>
              )}
              {tab === "sent" && !accepted && (
                <div className="flex gap-1">
                  <Button size="sm" className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAccept(p)}>
                    <Check className="h-3 w-3" /> Acceptée
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={() => handleRefuse(p)}>
                    <X className="h-3 w-3" /> Refusée
                  </Button>
                </div>
              )}
              {tab === "refused" && (
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleReopen(p)}>
                  Réouvrir
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
        {/* Expanded: Event Dossier */}
        {isOpen && accepted && (
          <TableRow>
            <TableCell colSpan={6} className="bg-muted/10 p-0">
              <div className="px-6 py-4">
                <EventDossier
                  proposal={{
                    id: p.id,
                    client_name: p.client_name,
                    client_email: p.client_email,
                    recipient_name: p.recipient_name,
                    client_id: p.client_id || null,
                    status: p.status,
                    proposal_speakers: p.proposal_speakers?.map(ps => ({
                      ...ps,
                      id: undefined,
                      speaker_id: ps.speaker_id,
                      speakers: ps.speakers ? {
                        name: ps.speakers.name,
                        formal_address: ps.speakers.formal_address,
                        phone: ps.speakers.phone,
                        email: ps.speakers.email,
                      } : null,
                    })) || [],
                  }}
                  onUpdate={fetchAll}
                />
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  // ─── Table wrapper ───
  const ProposalTable = ({ items, tab }: { items: Proposal[]; tab: string }) => (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Conférenciers</TableHead>
            <TableHead>Avancement</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(p => <ProposalRow key={p.id} p={p} tab={tab} />)}
          {items.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                Aucune proposition dans cette catégorie.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

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
            <DialogHeader><DialogTitle className="font-serif">Créer une proposition</DialogTitle></DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Société / Nom du client</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="SNCF" /></div>
                <div className="space-y-2"><Label>Email du client</Label><Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@societe.com" /></div>
              </div>
              <div className="space-y-2">
                <Label>Prénom Nom du destinataire (optionnel)</Label>
                <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Pascal DUPONT" />
                <p className="text-[11px] text-muted-foreground">Affiché en titre : « Votre proposition personnalisée — {recipientName || "Prénom Nom"} pour {clientName || "Société"} »</p>
              </div>
              <div className="space-y-2"><Label>Message personnalisé (optionnel)</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Bonjour, suite à notre échange..." rows={3} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Ville de l'événement</Label><Input value={eventCity} onChange={e => setEventCity(e.target.value)} placeholder="Paris" /></div>
                <div className="space-y-2"><Label>Date de l'événement</Label><Input value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="15 mars 2026" /></div>
                <div className="space-y-2"><Label>Taille auditoire</Label><Input value={audienceSize} onChange={e => setAudienceSize(e.target.value)} placeholder="200" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={isEnglish} onCheckedChange={(v) => setIsEnglish(!!v)} />
                <span className="text-sm">Intervention en anglais</span>
              </label>
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
                        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Cachet conférencier HT (€)</Label><Input type="number" placeholder="0" value={ps.speaker_fee ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "speaker_fee", e.target.value ? Number(e.target.value) : null)} /></div>
                        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Commission agence (€)</Label><Input type="number" placeholder="1000" value={ps.agency_commission ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "agency_commission", e.target.value ? Number(e.target.value) : null)} /></div>
                        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label><Input type="number" placeholder="0" value={ps.travel_costs ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "travel_costs", e.target.value ? Number(e.target.value) : null)} /></div>
                        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Prix total HT (€)</Label><Input type="number" value={ps.total_price ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "total_price", e.target.value ? Number(e.target.value) : null)} className="font-bold" /></div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Tarif de base : {speakers.find(s => s.id === ps.speaker_id)?.base_fee?.toLocaleString("fr-FR") ?? "—"} € · Commission : +{COMMISSION.toLocaleString("fr-FR")} €</p>
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
              <Button className="w-full" onClick={handleCreate} disabled={submitting}>{submitting ? "Création…" : "Créer la proposition"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="p-6">
        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setExpandedId(null); setStepFilter(null); }}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="drafts" className="gap-1.5">
                Brouillons
                {drafts.length > 0 && <Badge variant="secondary" className="text-[10px] h-5 min-w-5 px-1">{drafts.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-1.5">
                Envoyées
                {sentProposals.length > 0 && <Badge variant="secondary" className="text-[10px] h-5 min-w-5 px-1">{sentProposals.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="refused" className="gap-1.5">
                Refusées
                {refusedProposals.length > 0 && <Badge variant="destructive" className="text-[10px] h-5 min-w-5 px-1">{refusedProposals.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5">
                Terminées
                {completedProposals.length > 0 && <Badge className="text-[10px] h-5 min-w-5 px-1 bg-green-600">{completedProposals.length}</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Step filter for Envoyées tab */}
          {activeTab === "sent" && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filtrer par étape en attente :</span>
              {PIPELINE_STEPS.map(step => (
                <button
                  key={step.key}
                  onClick={() => setStepFilter(stepFilter === step.key ? null : step.key)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-full border transition-colors",
                    stepFilter === step.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {step.label}
                </button>
              ))}
              {stepFilter && (
                <button onClick={() => setStepFilter(null)} className="text-[10px] text-destructive underline ml-1">Effacer</button>
              )}
            </div>
          )}

          <TabsContent value="drafts"><ProposalTable items={drafts} tab="drafts" /></TabsContent>
          <TabsContent value="sent"><ProposalTable items={filteredSent} tab="sent" /></TabsContent>
          <TabsContent value="refused"><ProposalTable items={refusedProposals} tab="refused" /></TabsContent>
          <TabsContent value="completed"><ProposalTable items={completedProposals} tab="completed" /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminProposals;
