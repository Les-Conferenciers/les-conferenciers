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
import SimpleRichTextEditor from "@/components/admin/SimpleRichTextEditor";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Send, Trash2, ExternalLink, Copy, Check, RefreshCw, Archive, User, ChevronDown, ChevronUp, Pencil, Search } from "lucide-react";
import EventDossier from "@/components/admin/EventDossier";
import { toast } from "sonner";

const getDefaultMessage = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nSuite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.\n\nVous trouverez ci-joint un fichier PDF présentant une sélection de conférenciers, sous réserve de leur disponibilité.\n\nLes tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.\n\nJe reste bien entendu à votre disposition pour tout complément d'information. Et si aucun de ces profils ne correspondait pleinement à vos attentes, nous pourrions poursuivre ensemble les recherches afin d'identifier l'intervenant idéal.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers`;

const getDefaultEmailSubject = (clientName: string) =>
  `Votre sélection de conférenciers sur mesure - ${clientName || "Les Conférenciers"}`;

const getDefaultEmailBody = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nSuite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.\n\nVous trouverez ci-dessous une sélection de conférenciers soigneusement choisis pour ${clientName || "votre événement"}, sous réserve de leur disponibilité.\n\nLes tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.\n\n👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.\n\nJe reste bien entendu à votre disposition pour tout complément d'information.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers\n📞 06 95 93 97 91`;

const getUniqueEmailBody = (recipientName: string, speakerName: string, speakerFee: string, speakerSlug: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nJe fais suite à votre mail et à ma tentative de vous joindre par téléphone.\n\nJe suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants et vous adresse, comme convenu, le profil de ${speakerName}. Le tarif de son intervention est de ${speakerFee} € HT, hors frais VHR.\n\n👉 Découvrir le profil de ${speakerName} : ${window.location.origin}/conferencier/${speakerSlug}\n\nSi toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d'autres intervenants adaptés à vos critères.\nÀ ce titre, pourriez-vous m'indiquer la taille de l'auditoire envisagé ainsi que l'enveloppe budgétaire disponible ?\n\nJe reste bien entendu à votre entière disposition pour tout complément d'information.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers\n📞 06 95 93 97 91`;

const getInfoEmailBody = (recipientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nMerci pour votre message. J'ai tenté de vous joindre par téléphone sans succès et me permets donc de revenir vers vous par écrit.\n\nJe serais ravie de vous accompagner dans votre recherche d'intervenants. Afin de pouvoir vous proposer des profils parfaitement adaptés à vos besoins, pourriez-vous m'apporter quelques précisions concernant :\n\n• La taille de l'auditoire\n• Le profil des participants (commerciaux, managers, experts, etc.)\n• La durée souhaitée pour l'intervention\n• La thématique à aborder\n• Votre enveloppe budgétaire\n\nCes informations me permettront de cibler au mieux les conférenciers à vous suggérer.\n\nJe reste bien entendu à votre disposition pour en discuter de vive voix si vous le souhaitez.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers\n📞 06 95 93 97 91`;

type ProposalType = "classique" | "unique" | "info";

type SpeakerConference = { id: string; title: string; speaker_id: string };
type Speaker = { id: string; name: string; image_url: string | null; role: string | null; themes: string[] | null; base_fee: number | null; fee_details: string | null; city: string | null; formal_address?: boolean; email?: string | null; phone?: string | null; slug?: string };
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
  proposal_type?: string;
  reminder1_sent_at?: string | null;
  reminder2_sent_at?: string | null;
  proposal_speakers: {
    speaker_id: string;
    speaker_fee: number | null;
    travel_costs: number | null;
    agency_commission: number | null;
    total_price: number | null;
    display_order?: number | null;
    selected_conference_ids?: string[] | null;
    speakers: { name: string; image_url: string | null; formal_address?: boolean; email?: string | null; phone?: string | null } | null;
  }[];
};

const DEFAULT_COMMISSION = 0;

/** Speaker selector with search and alphabetical sort by last name */
const SpeakerSelector = ({ speakers, selectedSpeakers, onSelect }: {
  speakers: Speaker[];
  selectedSpeakers: ProposalSpeaker[];
  onSelect: (s: Speaker) => void;
}) => {
  const [search, setSearch] = useState("");
  
  const getLastName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1].toLowerCase();
  };
  
  const available = speakers
    .filter(s => !selectedSpeakers.find(ps => ps.speaker_id === s.id))
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name), "fr"));

  return (
    <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
      <Label className="text-xs text-muted-foreground block">Ajouter un conférencier</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom…"
          className="pl-8 text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto border border-input rounded-md">
        {available.map(s => (
          <button
            key={s.id}
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2 border-b border-border last:border-0"
            onClick={() => { onSelect(s); setSearch(""); }}
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {s.base_fee ? `${s.base_fee.toLocaleString("fr-FR")} €` : ""}
              {s.city ? ` · ${s.city}` : ""}
            </span>
          </button>
        ))}
        {available.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">Aucun résultat</div>
        )}
      </div>
    </div>
  );
};


/** Parse monetary values from fee_details text and return alternative rates with labels */
const parseAlternativeRates = (feeDetails: string | null | undefined, baseFee: number | null): { label: string; value: number }[] => {
  if (!feeDetails) return [];
  const rates: { label: string; value: number }[] = [];
  
  // Match patterns like: 6500, 3.5K, 3,5K, 10K, 2500 euros, etc.
  const regex = /(\d[\d\s]*(?:[.,]\d+)?)\s*(?:k|K|€|euros?)?/g;
  let match: RegExpExecArray | null;
  const fullText = feeDetails;
  
  while ((match = regex.exec(fullText)) !== null) {
    let rawNum = match[1].replace(/\s/g, "");
    let num: number;
    
    // Handle comma as decimal separator
    rawNum = rawNum.replace(",", ".");
    num = parseFloat(rawNum);
    if (isNaN(num)) continue;
    
    // Check if followed by K/k (thousands)
    const afterMatch = fullText.substring(match.index + match[0].length - 1, match.index + match[0].length + 1);
    const kCheck = fullText.substring(match.index, match.index + match[0].length + 2);
    if (/k/i.test(kCheck.charAt(kCheck.length - 1)) || /k/i.test(fullText.charAt(match.index + match[0].length))) {
      num = num * 1000;
    }
    
    // Skip tiny numbers (not fees)
    if (num < 500) continue;
    // Skip if it matches the base fee
    if (baseFee && Math.abs(num - baseFee) < 1) continue;
    
    // Extract context label: grab surrounding text as description
    const before = fullText.substring(Math.max(0, match.index - 60), match.index);
    const after = fullText.substring(match.index + match[0].length, Math.min(fullText.length, match.index + match[0].length + 80));
    
    // Build label from context
    let label = "";
    // Look for context after the number (e.g., "en anglais", "hors période...", "en province")
    const afterContext = after.replace(/^[\s€euroskK.,]+/, "").split(/[.;]|\bet\b|\d/)[0].trim();
    // Look for context before (e.g., "Visio")
    const beforeContext = before.split(/[.;,]/).pop()?.trim().replace(/^(et|ou)\s+/i, "") || "";
    
    if (beforeContext && !beforeContext.match(/^\d/) && beforeContext.length > 1 && beforeContext.length < 40) {
      label = `${num.toLocaleString("fr-FR")} € — ${beforeContext}${afterContext ? " " + afterContext : ""}`;
    } else if (afterContext && afterContext.length > 1 && afterContext.length < 60) {
      label = `${num.toLocaleString("fr-FR")} € — ${afterContext}`;
    } else {
      label = `${num.toLocaleString("fr-FR")} €`;
    }
    
    // Avoid duplicates
    if (!rates.find(r => Math.abs(r.value - num) < 1)) {
      rates.push({ label: label.trim(), value: num });
    }
  }
  
  return rates;
};

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
  const [editSelectedSpeakers, setEditSelectedSpeakers] = useState<ProposalSpeaker[]>([]);
  const [proposalType, setProposalType] = useState<ProposalType>("classique");
  const [globalCommission, setGlobalCommission] = useState<number>(0);

  useEffect(() => {
    Promise.all([fetchProposals(), fetchSpeakers(), fetchConferences()]);
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    const [proposalsRes, contractsRes, invoicesRes] = await Promise.all([
      supabase
        .from("proposals")
        .select("*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, display_order, selected_conference_ids, speakers(name, image_url, formal_address, email, phone))")
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
    const { data } = await supabase.from("speakers").select("id, name, image_url, role, themes, base_fee, fee_details, city, formal_address, email, phone, slug").order("name");
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

  const createProposalSpeaker = (speaker: Speaker, displayOrder: number): ProposalSpeaker => {
    const baseFee = speaker.base_fee ?? 0;
    return {
      speaker_id: speaker.id,
      speaker_fee: baseFee || null,
      travel_costs: 0,
      agency_commission: globalCommission,
      total_price: (baseFee + globalCommission) || null,
      display_order: displayOrder,
      selected_conference_ids: [],
    };
  };

  const normalizeSpeakerOrder = (items: ProposalSpeaker[]) =>
    items.map((item, index) => ({ ...item, display_order: index }));

  const buildProposalSpeakers = (items: Proposal["proposal_speakers"] = []): ProposalSpeaker[] =>
    normalizeSpeakerOrder(
      [...items]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((ps) => ({
          speaker_id: ps.speaker_id,
          speaker_fee: ps.speaker_fee,
          travel_costs: ps.travel_costs,
          agency_commission: ps.agency_commission,
          total_price: ps.total_price,
          display_order: ps.display_order ?? 0,
          selected_conference_ids: ps.selected_conference_ids || [],
        }))
    );

  const addSpeakerToList = (items: ProposalSpeaker[], speaker: Speaker) => {
    if (items.find(s => s.speaker_id === speaker.id)) {
      toast.error("Déjà ajouté");
      return items;
    }

    return [...items, createProposalSpeaker(speaker, items.length)];
  };

  const removeSpeakerFromList = (items: ProposalSpeaker[], speakerId: string) =>
    normalizeSpeakerOrder(items.filter(s => s.speaker_id !== speakerId));

  const moveSpeakerInList = (items: ProposalSpeaker[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return items;

    const nextItems = [...items];
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    return normalizeSpeakerOrder(nextItems);
  };

  const toggleConferenceInList = (items: ProposalSpeaker[], speakerId: string, confId: string) =>
    items.map(s => {
      if (s.speaker_id !== speakerId) return s;
      const ids = s.selected_conference_ids.includes(confId)
        ? s.selected_conference_ids.filter(id => id !== confId)
        : [...s.selected_conference_ids, confId];
      return { ...s, selected_conference_ids: ids };
    });

  const updateSpeakerFieldInList = (items: ProposalSpeaker[], speakerId: string, field: keyof ProposalSpeaker, value: number | null) =>
    items.map(s => {
      if (s.speaker_id !== speakerId) return s;
      const updated = { ...s, [field]: value };
      if (field !== "total_price" && field !== "display_order" && field !== "selected_conference_ids") {
        const fee = field === "speaker_fee" ? value : updated.speaker_fee;
        const travel = field === "travel_costs" ? value : updated.travel_costs;
        const comm = field === "agency_commission" ? value : updated.agency_commission;
        updated.total_price = (fee || 0) + (travel || 0) + (comm || 0) || null;
      }
      return updated;
    });

  const addSpeaker = (speaker: Speaker) => {
    if (proposalType === "unique" && selectedSpeakers.length >= 1) {
      toast.error("Un seul conférencier pour ce type"); return;
    }
    setSelectedSpeakers(prev => addSpeakerToList(prev, speaker));
    if (proposalType === "unique") {
      const fee = speaker.base_fee || 0;
      setEmailBody(getUniqueEmailBody(recipientName, speaker.name, fee.toLocaleString("fr-FR"), speaker.slug || ""));
    }
  };

  const removeSpeaker = (speakerId: string) => setSelectedSpeakers(prev => removeSpeakerFromList(prev, speakerId));

  const toggleConference = (speakerId: string, confId: string) => {
    setSelectedSpeakers(prev => toggleConferenceInList(prev, speakerId, confId));
  };

  const updateSpeakerField = (speakerId: string, field: keyof ProposalSpeaker, value: number | null) => {
    setSelectedSpeakers(prev => updateSpeakerFieldInList(prev, speakerId, field, value));
  };

  const getSpeakerName = (id: string) => speakers.find(s => s.id === id)?.name || "—";
  const getSpeakerImage = (id: string) => speakers.find(s => s.id === id)?.image_url || null;
  const getSpeakerCity = (id: string) => speakers.find(s => s.id === id)?.city || null;

  const handleCreate = async () => {
    if (!clientName || !clientEmail) {
      toast.error("Remplissez le nom et l'email du client"); return;
    }
    if (proposalType === "classique" && selectedSpeakers.length === 0) {
      toast.error("Ajoutez au moins 1 conférencier"); return;
    }
    if (proposalType === "unique" && selectedSpeakers.length === 0) {
      toast.error("Sélectionnez un conférencier"); return;
    }
    setSubmitting(true);
    const finalMessage = message || getDefaultMessage(recipientName, clientName);
    const finalSubject = emailSubject || getDefaultEmailSubject(clientName);
    let finalBody = emailBody;
    if (!finalBody) {
      if (proposalType === "unique" && selectedSpeakers.length > 0) {
        const sp = speakers.find(s => s.id === selectedSpeakers[0].speaker_id);
        finalBody = getUniqueEmailBody(recipientName, sp?.name || "", (selectedSpeakers[0].speaker_fee || 0).toLocaleString("fr-FR"), (sp as any)?.slug || "");
      } else if (proposalType === "info") {
        finalBody = getInfoEmailBody(recipientName);
      } else {
        finalBody = getDefaultEmailBody(recipientName, clientName);
      }
    }
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({ client_name: clientName, client_email: clientEmail, message: finalMessage, recipient_name: recipientName || null, email_subject: finalSubject, email_body: finalBody, proposal_type: proposalType } as any)
      .select().single();
    if (error || !proposal) { toast.error("Erreur création"); setSubmitting(false); return; }
    if (selectedSpeakers.length > 0) {
      const { error: spError } = await supabase
        .from("proposal_speakers")
        .insert(selectedSpeakers.map((s, i) => ({
          proposal_id: proposal.id, speaker_id: s.speaker_id, speaker_fee: s.speaker_fee,
          travel_costs: s.travel_costs, agency_commission: s.agency_commission, total_price: s.total_price,
          display_order: i, selected_conference_ids: s.selected_conference_ids.length > 0 ? s.selected_conference_ids : null,
        })));
      if (spError) { toast.error("Erreur ajout speakers"); setSubmitting(false); return; }
    }
    toast.success("Proposition créée !");
    setDialogOpen(false); resetForm(); fetchProposals(); setSubmitting(false);
  };

  const resetForm = () => {
    setClientName(""); setClientEmail(""); setRecipientName(""); setSelectedSpeakers([]);
    setEmailSubject(""); setEmailBody(""); setMessage(getDefaultMessage("", ""));
    setProposalType("classique"); setGlobalCommission(0);
  };

  const openEditDialog = (p: Proposal) => {
    setEditingProposal(p);
    setEditClientName(p.client_name); setEditClientEmail(p.client_email);
    setEditRecipientName(p.recipient_name || "");
    const pType = (p.proposal_type || "classique") as ProposalType;
    if (pType === "info") {
      setEditMessage("");
      setEditEmailSubject(p.email_subject || `Demande d'informations - ${p.client_name}`);
      setEditEmailBody(p.email_body || getInfoEmailBody(p.recipient_name || ""));
    } else if (pType === "unique") {
      setEditMessage("");
      setEditEmailSubject(p.email_subject || `Votre conférencier sur mesure - ${p.client_name}`);
      setEditEmailBody(p.email_body || "");
    } else {
      setEditMessage(p.message || getDefaultMessage(p.recipient_name || "", p.client_name));
      setEditEmailSubject(p.email_subject || getDefaultEmailSubject(p.client_name));
      setEditEmailBody(p.email_body || getDefaultEmailBody(p.recipient_name || "", p.client_name));
    }
    setEditSelectedSpeakers(buildProposalSpeakers(p.proposal_speakers));
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProposal) return;
    const pType = (editingProposal.proposal_type || "classique") as ProposalType;
    if (!editClientName || !editClientEmail) {
      toast.error("Remplissez le nom et email"); return;
    }
    if (pType === "classique" && editSelectedSpeakers.length === 0) {
      toast.error("Ajoutez au moins 1 conférencier"); return;
    }
    if (pType === "unique" && editSelectedSpeakers.length === 0) {
      toast.error("Sélectionnez un conférencier"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("proposals").update({
      client_name: editClientName, client_email: editClientEmail,
      recipient_name: editRecipientName || null,
      message: pType === "classique" ? (editMessage || null) : null,
      email_subject: editEmailSubject || null, email_body: editEmailBody || null,
    } as any).eq("id", editingProposal.id);
    if (error) { toast.error("Erreur"); setSubmitting(false); return; }

    if (pType !== "info") {
      const { error: deleteError } = await supabase.from("proposal_speakers").delete().eq("proposal_id", editingProposal.id);
      if (deleteError) { toast.error("Erreur sur les conférenciers"); setSubmitting(false); return; }

      if (editSelectedSpeakers.length > 0) {
        const { error: insertError } = await supabase
          .from("proposal_speakers")
          .insert(editSelectedSpeakers.map((speaker, index) => ({
            proposal_id: editingProposal.id,
            speaker_id: speaker.speaker_id,
            speaker_fee: speaker.speaker_fee,
            travel_costs: speaker.travel_costs,
            agency_commission: speaker.agency_commission,
            total_price: speaker.total_price,
            display_order: index,
            selected_conference_ids: speaker.selected_conference_ids.length > 0 ? speaker.selected_conference_ids : null,
          })));
        if (insertError) { toast.error("Erreur sur les tarifs des conférenciers"); setSubmitting(false); return; }
      }
    }

    toast.success("Proposition mise à jour !");
    setEditDialogOpen(false); setEditingProposal(null); setEditSelectedSpeakers([]); fetchProposals(); setSubmitting(false);
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

  const noScrollWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur();

  const handleProposalTypeChange = (type: ProposalType) => {
    setProposalType(type);
    setSelectedSpeakers([]);
    if (type === "info") {
      setEmailBody(getInfoEmailBody(recipientName));
      setMessage("");
      setEmailSubject(`Demande d'informations - ${clientName || "Les Conférenciers"}`);
    } else if (type === "unique") {
      setEmailBody("");
      setMessage("");
      setEmailSubject(`Votre conférencier sur mesure - ${clientName || "Les Conférenciers"}`);
    } else {
      setEmailBody(getDefaultEmailBody(recipientName, clientName));
      setMessage(getDefaultMessage(recipientName, clientName));
      setEmailSubject(getDefaultEmailSubject(clientName));
    }
  };

  const applyGlobalCommission = (val: number) => {
    setGlobalCommission(val);
    setSelectedSpeakers(prev => prev.map(s => {
      const updated = { ...s, agency_commission: val };
      updated.total_price = (updated.speaker_fee || 0) + (updated.travel_costs || 0) + val || null;
      return updated;
    }));
  };

  const renderSpeakerForm = () => (
    <div className="space-y-6 mt-4">
      {/* Proposal type selector */}
      <div className="space-y-2">
        <Label>Type de proposition</Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "classique" as ProposalType, label: "📋 Classique", desc: "Multi-conférenciers avec lien web" },
            { value: "unique" as ProposalType, label: "🎤 Conférencier unique", desc: "Un seul profil, tout dans l'email" },
            { value: "info" as ProposalType, label: "📝 Demande d'infos", desc: "Email simple sans conférencier" },
          ]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleProposalTypeChange(opt.value)}
              className={`border rounded-lg p-3 text-left transition-colors ${proposalType === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Société / Nom du client</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="SNCF" /></div>
        <div className="space-y-2"><Label>Email du client</Label><Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@societe.com" /></div>
      </div>
      <div className="space-y-2">
        <Label>Prénom Nom du destinataire (optionnel)</Label>
        <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Pascal DUPONT" />
      </div>

      {/* Message & Email - depends on type */}
      {proposalType === "classique" && (
        <div className="space-y-2">
          <Label>Message affiché dans la proposition</Label>
          <SimpleRichTextEditor value={message} onChange={setMessage} placeholder="Bonjour, suite à notre échange..." rows={4} />
        </div>
      )}

      <div className="space-y-2">
        <Label>✉️ Email d'envoi — Objet</Label>
        <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Objet de l'email" />
      </div>
      <div className="space-y-2">
        <Label>✉️ Email d'envoi — Corps</Label>
        <SimpleRichTextEditor value={emailBody} onChange={setEmailBody} placeholder="Corps de l'email..." rows={8} />
      </div>

      {/* Speakers section - not for "info" type */}
      {proposalType !== "info" && (
        <>
          {/* Global commission */}
          <div className="border border-border rounded-lg p-4 space-y-2 bg-muted/30">
            <Label className="text-sm font-medium">Commission agence globale (€)</Label>
            <p className="text-[11px] text-muted-foreground">Appliquée par défaut à chaque conférencier ajouté</p>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={globalCommission || ""}
              onChange={e => {
                const val = e.target.value ? Number(e.target.value) : 0;
                applyGlobalCommission(val);
              }}
              onWheel={noScrollWheel}
              placeholder="0"
              className="max-w-xs"
            />
          </div>

          <div className="space-y-3">
            <Label>Conférenciers ({selectedSpeakers.length}{proposalType === "unique" ? "/1" : ""})</Label>
            {selectedSpeakers.map((ps, idx) => {
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
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => {
                        setSelectedSpeakers(prev => {
                          const arr = [...prev];
                          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                          return arr;
                        });
                      }}><ChevronUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" disabled={idx === selectedSpeakers.length - 1} onClick={() => {
                        setSelectedSpeakers(prev => {
                          const arr = [...prev];
                          [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                          return arr;
                        });
                      }}><ChevronDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeSpeaker(ps.speaker_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
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
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Cachet conférencier (€)</Label>
                      {(() => {
                        const sp = speakers.find(s => s.id === ps.speaker_id);
                        const feeDetails = sp?.fee_details;
                        const altRates = parseAlternativeRates(feeDetails, sp?.base_fee ?? null);
                        return (
                          <div className="space-y-1">
                            {sp?.base_fee && (
                              <div className="text-xs font-medium text-accent mb-1">
                                Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €
                              </div>
                            )}
                            <Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.speaker_fee ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "speaker_fee", e.target.value ? Number(e.target.value) : null)} onWheel={noScrollWheel} />
                            {altRates.length > 0 && (
                              <select
                                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                value={ps.speaker_fee?.toString() || ""}
                                onChange={e => {
                                  if (e.target.value) updateSpeakerField(ps.speaker_id, "speaker_fee", Number(e.target.value));
                                }}
                              >
                                {sp?.base_fee && <option value={sp.base_fee.toString()}>Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €</option>}
                                {altRates.map((r, i) => (
                                  <option key={i} value={r.value}>{r.label}</option>
                                ))}
                              </select>
                            )}
                            {feeDetails && (
                              <p className="text-[10px] text-muted-foreground/70 italic leading-tight">{feeDetails}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.travel_costs ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "travel_costs", e.target.value ? Number(e.target.value) : null)} onWheel={noScrollWheel} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Commission agence (€)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.agency_commission ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "agency_commission", e.target.value ? Number(e.target.value) : null)} onWheel={noScrollWheel} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Prix total HT (€)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.total_price ?? ""} onChange={e => updateSpeakerField(ps.speaker_id, "total_price", e.target.value ? Number(e.target.value) : null)} onWheel={noScrollWheel} className="font-bold" /></div>
                  </div>
                </div>
              );
            })}
            {(proposalType === "classique" || (proposalType === "unique" && selectedSpeakers.length === 0)) && (
              <SpeakerSelector
                speakers={speakers}
                selectedSpeakers={selectedSpeakers}
                onSelect={addSpeaker}
              />
            )}
          </div>
        </>
      )}
      <Button className="w-full" onClick={handleCreate} disabled={submitting}>
        {submitting ? "Création…" : "Créer la proposition"}
      </Button>
    </div>
  );

  const renderSpeakerSelectionEditor = (
    items: ProposalSpeaker[],
    setItems: React.Dispatch<React.SetStateAction<ProposalSpeaker[]>>,
  ) => (
    <div className="space-y-3">
      <Label>Conférenciers ({items.length})</Label>
      {items.map((ps, idx) => {
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
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => setItems(prev => moveSpeakerInList(prev, idx, "up"))}><ChevronUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" disabled={idx === items.length - 1} onClick={() => setItems(prev => moveSpeakerInList(prev, idx, "down"))}><ChevronDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setItems(prev => removeSpeakerFromList(prev, ps.speaker_id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            {speakerConfs.length > 0 && (
              <div className="space-y-2 bg-muted/50 rounded-md p-3">
                <Label className="text-xs text-muted-foreground">Conférences à inclure</Label>
                {speakerConfs.map(conf => (
                  <div key={conf.id} className="flex items-center gap-2">
                    <Checkbox id={`edit-conf-${conf.id}-${ps.speaker_id}`} checked={ps.selected_conference_ids.includes(conf.id)} onCheckedChange={() => setItems(prev => toggleConferenceInList(prev, ps.speaker_id, conf.id))} />
                    <label htmlFor={`edit-conf-${conf.id}-${ps.speaker_id}`} className="text-sm cursor-pointer leading-tight">{conf.title}</label>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cachet conférencier (€)</Label>
                {(() => {
                  const sp = speakers.find(s => s.id === ps.speaker_id);
                  const feeDetails = sp?.fee_details;
                  const altRates = parseAlternativeRates(feeDetails, sp?.base_fee ?? null);
                  return (
                    <div className="space-y-1">
                      {sp?.base_fee && (
                        <div className="text-xs font-medium text-accent mb-1">
                          Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €
                        </div>
                      )}
                      <Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.speaker_fee ?? ""} onChange={e => setItems(prev => updateSpeakerFieldInList(prev, ps.speaker_id, "speaker_fee", e.target.value ? Number(e.target.value) : null))} onWheel={noScrollWheel} />
                      {altRates.length > 0 && (
                        <select
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                          value={ps.speaker_fee?.toString() || ""}
                          onChange={e => {
                            if (e.target.value) setItems(prev => updateSpeakerFieldInList(prev, ps.speaker_id, "speaker_fee", Number(e.target.value)));
                          }}
                        >
                          {sp?.base_fee && <option value={sp.base_fee.toString()}>Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €</option>}
                          {altRates.map((r, i) => (
                            <option key={i} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      )}
                      {feeDetails && (
                        <p className="text-[10px] text-muted-foreground/70 italic leading-tight">{feeDetails}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.travel_costs ?? ""} onChange={e => setItems(prev => updateSpeakerFieldInList(prev, ps.speaker_id, "travel_costs", e.target.value ? Number(e.target.value) : null))} onWheel={noScrollWheel} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Commission agence (€)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.agency_commission ?? ""} onChange={e => setItems(prev => updateSpeakerFieldInList(prev, ps.speaker_id, "agency_commission", e.target.value ? Number(e.target.value) : null))} onWheel={noScrollWheel} /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Prix total HT (€)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={ps.total_price ?? ""} onChange={e => setItems(prev => updateSpeakerFieldInList(prev, ps.speaker_id, "total_price", e.target.value ? Number(e.target.value) : null))} onWheel={noScrollWheel} className="font-bold" /></div>
            </div>
          </div>
        );
      })}
      <SpeakerSelector
        speakers={speakers}
        selectedSpeakers={items}
        onSelect={(speaker) => setItems(prev => addSpeakerToList(prev, speaker))}
      />
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
              {(!p.proposal_speakers || p.proposal_speakers.length === 0) && (
                <span className="text-xs text-muted-foreground italic">
                  {(p as any).proposal_type === "info" ? "Demande d'infos" : "Aucun"}
                </span>
              )}
            </div>
          </TableCell>
          <TableCell>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              (p as any).proposal_type === "unique" ? "bg-violet-100 text-violet-700" :
              (p as any).proposal_type === "info" ? "bg-sky-100 text-sky-700" :
              "bg-emerald-100 text-emerald-700"
            }`}>
              {(p as any).proposal_type === "unique" ? "🎤 Unique" :
               (p as any).proposal_type === "info" ? "📝 Infos" :
               "📋 Classique"}
            </span>
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
            <TableHead>Type</TableHead>
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
          <TabsTrigger value="sent" className="gap-1.5 text-xs">
            📤 Envoyées {sent.length > 0 && <span className="ml-1 bg-muted-foreground/20 text-muted-foreground rounded-full px-1.5 text-[10px]">{sent.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5 text-xs">
            ✅ Terminées {completed.length > 0 && <span className="ml-1 bg-muted-foreground/20 text-muted-foreground rounded-full px-1.5 text-[10px]">{completed.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-1.5 text-xs">
            🗄️ Archivées {archived.length > 0 && <span className="ml-1 bg-muted-foreground/20 text-muted-foreground rounded-full px-1.5 text-[10px]">{archived.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts">{renderTable(drafts, "draft")}</TabsContent>
        <TabsContent value="sent">{renderTable(sent, "sent")}</TabsContent>
        <TabsContent value="completed">{renderTable(completed, "completed")}</TabsContent>
        <TabsContent value="archived">{renderTable(archived, "draft")}</TabsContent>
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
              <SimpleRichTextEditor value={editMessage} onChange={setEditMessage} rows={8} />
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-sm mb-3">✉️ Email d'envoi</h3>
              <div className="space-y-3">
                <div className="space-y-2"><Label className="text-xs text-muted-foreground">Objet</Label><Input value={editEmailSubject} onChange={e => setEditEmailSubject(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-xs text-muted-foreground">Corps du mail</Label><SimpleRichTextEditor value={editEmailBody} onChange={setEditEmailBody} rows={10} /></div>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-sm mb-3">🎤 Conférenciers et tarifs</h3>
              {renderSpeakerSelectionEditor(editSelectedSpeakers, setEditSelectedSpeakers)}
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
