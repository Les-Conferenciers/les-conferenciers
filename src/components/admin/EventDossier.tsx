import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Receipt, Plus, ExternalLink, Send, CheckCircle, Printer, Pencil,
  Ban, CircleDollarSign, Trash2, Percent, ClipboardList, Video, Mail, User, CalendarIcon, UserPlus, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──

type Proposal = {
  id: string;
  client_name: string;
  client_email: string;
  recipient_name: string | null;
  client_id: string | null;
  status: string;
  proposal_type?: string;
  event_date_text?: string | null;
  event_location?: string | null;
  audience_size?: string | null;
  proposal_speakers: {
    id?: string;
    speaker_id?: string;
    speaker_fee: number | null;
    travel_costs: number | null;
    agency_commission: number | null;
    total_price: number | null;
    speakers: { name: string; formal_address?: boolean; phone?: string; email?: string } | null;
  }[];
};

type Contract = {
  id: string;
  proposal_id: string;
  token: string | null;
  event_date: string | null;
  event_location: string | null;
  event_time: string | null;
  event_format: string | null;
  event_description: string | null;
  status: string;
  signer_name: string | null;
  signed_at: string | null;
  created_at: string;
  contract_lines: any;
  discount_percent: number | null;
};

type Invoice = {
  id: string;
  proposal_id: string;
  contract_id: string | null;
  invoice_number: string;
  invoice_type: string;
  amount_ht: number;
  tva_rate: number;
  amount_ttc: number;
  status: string;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
};

type EventData = {
  id: string;
  proposal_id: string;
  bdc_number: string | null;
  audience_size: string | null;
  theme: string | null;
  speaker_budget: number | null;
  info_sent_speaker_at: string | null;
  contract_sent_speaker_at: string | null;
  visio_date: string | null;
  visio_time: string | null;
  visio_notes: string | null;
  liaison_sheet_sent_at: string | null;
  speaker_paid_at: string | null;
  notes: string | null;
  selected_speaker_id: string | null;
  event_title: string | null;
  contact_on_site_name: string | null;
  contact_on_site_phone: string | null;
  contact_on_site_email: string | null;
  tech_needs: string | null;
  room_setup: string | null;
  arrival_info: string | null;
  dress_code: string | null;
  special_requests: string | null;
  conference_title: string | null;
  conference_duration: string | null;
  parking_info: string | null;
  hotel_info: string | null;
};

type ContractLine = {
  id: string;
  label: string;
  amount_ht: number;
  tva_rate: number;
  type: "speaker" | "travel" | "custom";
};

type ClientContact = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
  address: string | null;
  city: string | null;
};

type Props = {
  proposal: Proposal;
  onUpdate: () => void;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

const TVA_OPTIONS = [
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "20", label: "20%" },
];

const EventDossier = ({ proposal, onUpdate }: Props) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  // Contract form
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventFormat, setEventFormat] = useState("Conférence");
  const [eventDescription, setEventDescription] = useState("");
  const [contractAudienceSize, setContractAudienceSize] = useState("");
  const [contractBdcNumber, setContractBdcNumber] = useState("");
  const [contractLines, setContractLines] = useState<ContractLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  // Client for contract creation
  const [contractClientId, setContractClientId] = useState<string>("");
  const [showCreateClientInContract, setShowCreateClientInContract] = useState(false);
  const [newContractClientCompany, setNewContractClientCompany] = useState("");
  const [newContractClientContact, setNewContractClientContact] = useState("");
  const [newContractClientEmail, setNewContractClientEmail] = useState("");
  const [newContractClientPhone, setNewContractClientPhone] = useState("");
  const [newContractClientSiret, setNewContractClientSiret] = useState("");
  const [newContractClientAddress, setNewContractClientAddress] = useState("");
  const [newContractClientCity, setNewContractClientCity] = useState("");

  // Contract email
  const [contractEmailOpen, setContractEmailOpen] = useState(false);
  const [contractEmailSubject, setContractEmailSubject] = useState("");
  const [contractEmailBody, setContractEmailBody] = useState("");
  const [sendingContract, setSendingContract] = useState(false);

  // Client contact for contract email
  const [clients, setClients] = useState<ClientContact[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [contractRecipientEmail, setContractRecipientEmail] = useState("");
  const [contractRecipientName, setContractRecipientName] = useState("");
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  // Speaker info email
  const [speakerEmailOpen, setSpeakerEmailOpen] = useState(false);
  const [speakerEmailSubject, setSpeakerEmailSubject] = useState("");
  const [speakerEmailBody, setSpeakerEmailBody] = useState("");
  const [sendingSpeakerEmail, setSendingSpeakerEmail] = useState(false);
  const [speakerEmailType, setSpeakerEmailType] = useState<"info" | "contract">("info");

  // Liaison sheet dialog
  const [liaisonDialogOpen, setLiaisonDialogOpen] = useState(false);
  const [liaisonNotes, setLiaisonNotes] = useState("");
  const [liaisonTechNeeds, setLiaisonTechNeeds] = useState("");
  const [liaisonArrival, setLiaisonArrival] = useState("");
  const [liaisonSalleSetup, setLiaisonSalleSetup] = useState("");
  const [sendingLiaison, setSendingLiaison] = useState(false);
  const [liaisonClientSubject, setLiaisonClientSubject] = useState("");
  const [liaisonClientBody, setLiaisonClientBody] = useState("");
  const [liaisonSpeakerSubject, setLiaisonSpeakerSubject] = useState("");
  const [liaisonSpeakerBody, setLiaisonSpeakerBody] = useState("");
  const [liaisonClientCc, setLiaisonClientCc] = useState("");
  const [liaisonSpeakerCc, setLiaisonSpeakerCc] = useState("");
  const [liaisonTab, setLiaisonTab] = useState<"client" | "speaker">("client");

  // Visio quick picker
  const [visioQuickDate, setVisioQuickDate] = useState<Date | undefined>();
  const [visioQuickTime, setVisioQuickTime] = useState("");

  // Invoice form
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"acompte" | "solde" | "total">("total");
  const [dueDate, setDueDate] = useState("");
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Invoice edit
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editAmountHT, setEditAmountHT] = useState(0);
  const [editTvaRate, setEditTvaRate] = useState(20);
  const [editDueDate, setEditDueDate] = useState("");

  // Invoice email
  const [invoiceEmailOpen, setInvoiceEmailOpen] = useState(false);
  const [invoiceEmailSubject, setInvoiceEmailSubject] = useState("");
  const [invoiceEmailBody, setInvoiceEmailBody] = useState("");
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);

  // Event details edit
  const [eventEditOpen, setEventEditOpen] = useState(false);
  const [editBdcNumber, setEditBdcNumber] = useState("");
  const [editAudienceSize, setEditAudienceSize] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editSpeakerBudget, setEditSpeakerBudget] = useState<number | "">("");
  const [editVisioDate, setEditVisioDate] = useState("");
  const [editVisioTime, setEditVisioTime] = useState("");
  const [editVisioNotes, setEditVisioNotes] = useState("");
  const [editEventNotes, setEditEventNotes] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editContactOnSiteName, setEditContactOnSiteName] = useState("");
  const [editContactOnSitePhone, setEditContactOnSitePhone] = useState("");
  const [editContactOnSiteEmail, setEditContactOnSiteEmail] = useState("");
  const [editTechNeeds, setEditTechNeeds] = useState("");
  const [editRoomSetup, setEditRoomSetup] = useState("");
  const [editArrivalInfo, setEditArrivalInfo] = useState("");
  const [editDressCode, setEditDressCode] = useState("");
  const [editSpecialRequests, setEditSpecialRequests] = useState("");
  const [editConferenceTitle, setEditConferenceTitle] = useState("");
  const [editConferenceDuration, setEditConferenceDuration] = useState("");
  const [editParkingInfo, setEditParkingInfo] = useState("");
  const [editHotelInfo, setEditHotelInfo] = useState("");

  useEffect(() => {
    fetchData();
    fetchClients();
  }, [proposal.id]);

  const fetchData = async () => {
    setLoading(true);
    const [contractRes, invoicesRes, eventRes] = await Promise.all([
      supabase.from("contracts").select("*").eq("proposal_id", proposal.id).maybeSingle(),
      supabase.from("invoices").select("*").eq("proposal_id", proposal.id).order("created_at"),
      supabase.from("events").select("*").eq("proposal_id", proposal.id).maybeSingle(),
    ]);
    setContract(contractRes.data as any);
    setInvoices((invoicesRes.data as any) || []);
    setEvent(eventRes.data as any);
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, company_name, contact_name, email, phone, siret, address, city").order("company_name");
    setClients((data as any) || []);
  };

  // ─── Auto-create event if missing ───
  useEffect(() => {
    if (!loading && !event) {
      supabase.from("events").insert({ proposal_id: proposal.id } as any).then(() => fetchData());
    }
  }, [loading, event]);

  // Auto-select speaker if only one
  useEffect(() => {
    if (event && !event.selected_speaker_id && proposal.proposal_speakers.length === 1 && proposal.proposal_speakers[0]?.speaker_id) {
      supabase.from("events").update({ selected_speaker_id: proposal.proposal_speakers[0].speaker_id } as any).eq("id", event.id).then(() => fetchData());
    }
  }, [event?.id, event?.selected_speaker_id]);

  // Sync visio quick picker from event data
  useEffect(() => {
    if (event?.visio_date) setVisioQuickDate(new Date(event.visio_date + "T12:00:00"));
    else setVisioQuickDate(undefined);
    setVisioQuickTime(event?.visio_time || "");
  }, [event?.visio_date, event?.visio_time]);

  // ─── Selected speaker helper ───
  const getSelectedSpeaker = () => {
    if (!event?.selected_speaker_id) return proposal.proposal_speakers[0] || null;
    return proposal.proposal_speakers.find(ps => ps.speaker_id === event.selected_speaker_id) || proposal.proposal_speakers[0] || null;
  };

  const getSelectedSpeakerInfo = () => getSelectedSpeaker()?.speakers || null;

  const handleSelectSpeaker = async (speakerId: string) => {
    if (!event) return;
    await supabase.from("events").update({ selected_speaker_id: speakerId } as any).eq("id", event.id);
    toast.success("Conférencier sélectionné");
    fetchData();
  };

  // ─── Compute totals ───
  const computeTotals = (lines: ContractLine[], discount: number) => {
    const subtotalHT = lines.reduce((sum, l) => sum + l.amount_ht, 0);
    const discountAmount = subtotalHT * (discount / 100);
    const totalHTAfterDiscount = subtotalHT - discountAmount;
    const totalTVA = lines.reduce((sum, l) => {
      const lineShare = subtotalHT > 0 ? l.amount_ht / subtotalHT : 0;
      const lineHTAfterDiscount = l.amount_ht - (discountAmount * lineShare);
      return sum + lineHTAfterDiscount * (l.tva_rate / 100);
    }, 0);
    const totalTTC = totalHTAfterDiscount + totalTVA;
    return { subtotalHT, discountAmount, totalHTAfterDiscount, totalTVA, totalTTC };
  };

  const getEffectiveLines = (): ContractLine[] => {
    if (contract?.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0) {
      return contract.contract_lines as ContractLine[];
    }
    // For multiple proposals with a selected speaker, only show the selected one
    const speakersForContract = event?.selected_speaker_id
      ? proposal.proposal_speakers.filter(ps => ps.speaker_id === event.selected_speaker_id)
      : proposal.proposal_speakers;
    return speakersForContract.map((ps, i) => ({
      id: generateId(),
      label: ps.speakers?.name || `Conférencier ${i + 1}`,
      amount_ht: ps.total_price || 0,
      tva_rate: 20,
      type: "speaker" as const,
    }));
  };

  const effectiveDiscount = contract?.discount_percent || 0;
  const effectiveLines = getEffectiveLines();
  const { totalHTAfterDiscount, totalTTC } = computeTotals(effectiveLines, effectiveDiscount);

  const selectedSpeaker = getSelectedSpeaker();
  const speakerInfo = getSelectedSpeakerInfo();
  const speakerSummary = speakerInfo?.name || effectiveLines
    .filter(l => l.type === "speaker")
    .map(l => l.label)
    .join(", ") || proposal.proposal_speakers.map(s => s.speakers?.name || "—").join(", ");

  const buildInitialLines = (): ContractLine[] => {
    if (contract?.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0) {
      return contract.contract_lines as ContractLine[];
    }
    // For multiple proposals with a selected speaker, only show the selected one
    const speakersForContract = event?.selected_speaker_id
      ? proposal.proposal_speakers.filter(ps => ps.speaker_id === event.selected_speaker_id)
      : proposal.proposal_speakers;
    return speakersForContract.map((ps, i) => ({
      id: generateId(),
      label: ps.speakers?.name || `Conférencier ${i + 1}`,
      amount_ht: ps.total_price || 0,
      tva_rate: 20,
      type: "speaker" as const,
    }));
  };

  const updateLine = (id: string, field: keyof ContractLine, value: any) => {
    setContractLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };
  const removeLine = (id: string) => setContractLines(prev => prev.filter(l => l.id !== id));
  const addLine = (type: ContractLine["type"]) => {
    const defaults: Record<string, string> = { speaker: "Conférencier", travel: "Frais de déplacement", custom: "Prestation complémentaire" };
    setContractLines(prev => [...prev, { id: generateId(), label: defaults[type], amount_ht: 0, tva_rate: 20, type }]);
  };

  // ─── Contract CRUD ───
  const openCreateContract = () => {
    setEditingContract(false);
    // Auto-fill from proposal data
    setEventDate(""); 
    setEventLocation(proposal.event_location || ""); 
    setEventTime(""); 
    setEventFormat("Conférence"); 
    setEventDescription("");
    setContractAudienceSize(proposal.audience_size || "");
    setContractBdcNumber("");
    setContractLines(buildInitialLines()); setDiscountPercent(0);
    // Pre-select client if proposal already has one
    setContractClientId(proposal.client_id || "");
    setShowCreateClientInContract(false);
    setNewContractClientCompany(""); setNewContractClientContact(""); setNewContractClientEmail("");
    setNewContractClientPhone(""); setNewContractClientSiret(""); setNewContractClientAddress(""); setNewContractClientCity("");
    setContractDialogOpen(true);
  };

  const openEditContract = () => {
    if (!contract) return;
    setEditingContract(true);
    setEventDate(contract.event_date || ""); setEventLocation(contract.event_location || "");
    setEventTime(contract.event_time || ""); setEventFormat(contract.event_format || "Conférence");
    setEventDescription(contract.event_description || "");
    setContractAudienceSize(event?.audience_size || proposal.audience_size || "");
    setContractBdcNumber(event?.bdc_number || "");
    setContractLines(buildInitialLines()); setDiscountPercent(contract.discount_percent || 0);
    setContractClientId(proposal.client_id || "");
    setShowCreateClientInContract(false);
    setContractDialogOpen(true);
  };

  const handleCreateContractClient = async () => {
    if (!newContractClientCompany) { toast.error("Nom de société requis"); return; }
    if (!newContractClientEmail) { toast.error("Email requis pour le contrat"); return; }
    setCreatingClient(true);
    const { data, error } = await supabase.from("clients").insert({
      company_name: newContractClientCompany,
      contact_name: newContractClientContact || null,
      email: newContractClientEmail || null,
      phone: newContractClientPhone || null,
      siret: newContractClientSiret || null,
      address: newContractClientAddress || null,
      city: newContractClientCity || null,
    } as any).select().single();
    if (error || !data) { toast.error("Erreur création client"); setCreatingClient(false); return; }
    toast.success("Client créé !");
    await fetchClients();
    setContractClientId((data as any).id);
    setShowCreateClientInContract(false);
    setNewContractClientCompany(""); setNewContractClientContact(""); setNewContractClientEmail("");
    setNewContractClientPhone(""); setNewContractClientSiret(""); setNewContractClientAddress(""); setNewContractClientCity("");
    setCreatingClient(false);
  };

  const handleSaveContract = async () => {
    if (!contractClientId) {
      toast.error("Veuillez sélectionner ou créer un client avant de créer le contrat");
      return;
    }
    setSaving(true);
    const payload = {
      event_date: eventDate || null,
      event_location: eventLocation || null,
      event_time: eventTime || null,
      event_format: eventFormat || null,
      event_description: eventDescription || null,
      contract_lines: contractLines,
      discount_percent: discountPercent || 0,
    };
    // Link client to proposal
    await supabase.from("proposals").update({ client_id: contractClientId } as any).eq("id", proposal.id);
    // Also update event with audience_size and bdc_number
    if (event) {
      await supabase.from("events").update({ 
        audience_size: contractAudienceSize || null,
        bdc_number: contractBdcNumber || null,
      } as any).eq("id", event.id);
    }
    if (editingContract && contract) {
      const { error } = await supabase.from("contracts").update(payload as any).eq("id", contract.id);
      if (error) toast.error("Erreur mise à jour"); else toast.success("Contrat mis à jour !");
    } else {
      const { error } = await supabase.from("contracts").insert({ proposal_id: proposal.id, ...payload } as any);
      if (error) { toast.error("Erreur création contrat"); console.error(error); } else toast.success("Contrat créé !");
    }
    setContractDialogOpen(false); fetchData(); onUpdate(); setSaving(false);
  };

  // ─── Contract email ───
  const openContractEmail = () => {
    if (!contract) return;
    const dateStr = contract.event_date ? new Date(contract.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "à définir";
    const totals = computeTotals(getEffectiveLines(), contract.discount_percent || 0);

    // Pre-fill recipient from proposal
    setContractRecipientName(proposal.recipient_name || "");
    setContractRecipientEmail(proposal.client_email);
    setSelectedClientId("");
    setShowCreateClient(false);

    setContractEmailSubject(`Bon de commande - ${proposal.client_name} - Les Conférenciers`);
    setContractEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Suite à votre accord, je vous transmets le bon de commande pour votre événement.

📋 Récapitulatif :
• Conférencier(s) : ${speakerSummary}
• Date : ${dateStr}
• Lieu : ${contract.event_location || "à définir"}
• Montant total TTC : ${totals.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €

👉 Cliquez sur le bouton ci-dessous pour consulter le contrat et le signer électroniquement.

N'hésitez pas à me contacter pour toute question.

Bien cordialement,
Nelly Sabde - Les Conférenciers`);
    setContractEmailOpen(true);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setContractRecipientName(client.contact_name || "");
      setContractRecipientEmail(client.email || "");
      // Update email body greeting
      const firstName = client.contact_name?.split(" ")[0] || "";
      setContractEmailBody(prev => {
        const lines = prev.split("\n");
        if (lines[0]?.startsWith("Bonjour")) {
          lines[0] = `Bonjour${firstName ? ` ${firstName}` : ""},`;
        }
        return lines.join("\n");
      });
    }
  };

  const handleCreateNewClient = async () => {
    if (!newClientCompany) { toast.error("Nom de société requis"); return; }
    setCreatingClient(true);
    const { data, error } = await supabase.from("clients").insert({
      company_name: newClientCompany,
      contact_name: newClientContact || null,
      email: newClientEmail || null,
      phone: newClientPhone || null,
    } as any).select().single();
    if (error || !data) { toast.error("Erreur création client"); setCreatingClient(false); return; }
    toast.success("Client créé !");
    await fetchClients();
    // Auto-select new client
    setSelectedClientId((data as any).id);
    setContractRecipientName(newClientContact || "");
    setContractRecipientEmail(newClientEmail || "");
    setShowCreateClient(false);
    setNewClientCompany(""); setNewClientContact(""); setNewClientEmail(""); setNewClientPhone("");
    setCreatingClient(false);
  };

  const handleSendContractEmail = async () => {
    if (!contract) return;
    if (!contractRecipientEmail) { toast.error("Email du destinataire requis"); return; }
    setSendingContract(true);
    try {
      const { error } = await supabase.functions.invoke("send-contract-email", {
        body: {
          contract_id: contract.id,
          email_subject: contractEmailSubject,
          email_body: contractEmailBody,
          recipient_email: contractRecipientEmail,
        },
      });
      if (error) throw error;
      await supabase.from("contracts").update({ status: "sent" } as any).eq("id", contract.id);
      toast.success("Contrat envoyé par email !");
      setContractEmailOpen(false);
      fetchData(); onUpdate();
    } catch { toast.error("Erreur d'envoi du contrat"); }
    setSendingContract(false);
  };

  // ─── Speaker email ───
  const openSpeakerEmail = (type: "info" | "contract") => {
    setSpeakerEmailType(type);
    const speaker = getSelectedSpeakerInfo();
    const speakerName = speaker?.name || "le conférencier";
    const firstName = speakerName.split(" ")[0];
    const isFormal = speaker?.formal_address !== false;
    const greeting = isFormal ? `Bonjour ${firstName},` : `Hello ${firstName},`;
    const vouvoi = isFormal;

    const dateStr = contract?.event_date ? new Date(contract.event_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "à définir";
    const ps = getSelectedSpeaker();
    const budget = event?.speaker_budget || ps?.speaker_fee || 0;

    if (type === "info") {
      setSpeakerEmailSubject(`Intervention - ${proposal.client_name}${event?.event_title ? ` - ${event.event_title}` : ""}`);
      setSpeakerEmailBody(`${greeting}

${vouvoi ? "Voici comme convenu les informations concernant votre intervention :" : "Voici comme convenu les infos concernant ton intervention :"}

📅 Date de l'évènement : ${dateStr}
📍 Lieu de l'intervention : ${contract?.event_location || "à définir"}
🕐 Horaires de l'intervention : ${contract?.event_time || "à définir"}
${event?.conference_title ? `🎤 Conférence : ${event.conference_title}` : ""}
${event?.conference_duration ? `⏱ Durée : ${event.conference_duration}` : ""}
👥 Auditoire : ${event?.audience_size || "à définir"}
📋 Thématique : ${event?.theme || "à définir"}
🏢 Client : ${proposal.client_name}
💰 Budget : ${budget ? budget.toLocaleString("fr-FR") + " euros HT, hors frais VHR" : "à définir"}
${event?.dress_code ? `👔 Dress code : ${event.dress_code}` : ""}
${event?.contact_on_site_name ? `\n👤 Contact sur place : ${event.contact_on_site_name}${event?.contact_on_site_phone ? ` - ${event.contact_on_site_phone}` : ""}${event?.contact_on_site_email ? ` - ${event.contact_on_site_email}` : ""}` : ""}
${event?.arrival_info ? `🚗 Arrivée : ${event.arrival_info}` : ""}
${event?.parking_info ? `🅿️ Parking : ${event.parking_info}` : ""}
${event?.hotel_info ? `🏨 Hôtel : ${event.hotel_info}` : ""}
${event?.tech_needs ? `🔧 Technique : ${event.tech_needs}` : ""}
${event?.room_setup ? `🪑 Configuration salle : ${event.room_setup}` : ""}
${event?.special_requests ? `\n📝 Remarques : ${event.special_requests}` : ""}

${vouvoi ? "À très bientôt et bonne journée !" : "A très vite et bonne journée !"}

Nelly Sabde - Les Conférenciers`);
    } else {
      setSpeakerEmailSubject(`Bon de commande - ${proposal.client_name} - Les Conférenciers`);
      setSpeakerEmailBody(`${greeting}

${vouvoi ? "Veuillez trouver ci-joint le bon de commande pour votre intervention :" : "Voici le bon de commande pour ton intervention :"}

📅 Date de l'évènement : ${dateStr}
📍 Lieu : ${contract?.event_location || "à définir"}
🏢 Client : ${proposal.client_name}
💰 Budget : ${budget ? budget.toLocaleString("fr-FR") + " euros HT, hors frais VHR" : "à définir"}

${vouvoi ? "Restant à votre disposition." : "A très vite !"}

Nelly Sabde - Les Conférenciers`);
    }
    setSpeakerEmailOpen(true);
  };

  const handleSendSpeakerEmail = async () => {
    setSendingSpeakerEmail(true);
    const speaker = getSelectedSpeakerInfo();
    const speakerEmail = speaker?.email;
    
    if (!speakerEmail) {
      toast.error("Pas d'email renseigné pour ce conférencier");
      setSendingSpeakerEmail(false);
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          to: speakerEmail,
          subject: speakerEmailSubject,
          body: speakerEmailBody,
          from_name: "Les Conférenciers",
        },
      });
      if (error) throw error;

      // Track in event
      const field = speakerEmailType === "info" ? "info_sent_speaker_at" : "contract_sent_speaker_at";
      if (event) {
        await supabase.from("events").update({ [field]: new Date().toISOString() } as any).eq("id", event.id);
      }
      toast.success("Email envoyé au conférencier !");
      setSpeakerEmailOpen(false);
      fetchData();
    } catch { toast.error("Erreur d'envoi"); }
    setSendingSpeakerEmail(false);
  };

  // ─── Liaison Sheet ───
  const openLiaisonDialog = () => {
    const speaker = getSelectedSpeakerInfo();
    const speakerName = speaker?.name || "";
    const speakerFirstName = speakerName.split(" ")[0];
    const isFormal = speaker?.formal_address !== false;
    const clientFirstName = proposal.recipient_name?.split(" ")[0] || "";

    setLiaisonNotes(event?.visio_notes || "");
    setLiaisonTechNeeds(event?.tech_needs || "Vidéoprojecteur");
    setLiaisonSalleSetup(event?.room_setup || "Salle installée en largeur avec une allée centrale si possible");
    setLiaisonArrival(event?.arrival_info || "");
    setLiaisonTab("client");

    // Client email template
    setLiaisonClientSubject(`Feuille de liaison - ${speakerName} - ${proposal.client_name}`);
    setLiaisonClientBody(`${clientFirstName ? clientFirstName : "Bonjour"},

Un grand merci pour nos échanges${event?.visio_date ? " de ce matin" : ""} !

Vous trouverez ci-joint comme convenu la feuille de liaison pour l'intervention de ${speakerName}${speaker?.phone ? " laissant apparaître son numéro de téléphone portable" : ""}.

Vous en souhaitant bonne réception et restant à votre disposition si besoin est.

Excellente fin de journée à vous !

Nelly Sabde - Les Conférenciers`);

    // Speaker email template
    setLiaisonSpeakerSubject(`Feuille de liaison - ${proposal.client_name}`);
    setLiaisonSpeakerBody(`${speakerFirstName},

${isFormal ? "Voici comme convenu la feuille de liaison pour votre intervention." : "Voici comme convenu la feuille de liaison pour ton intervention."}

${isFormal ? "À très bientôt !" : "A très vite !"}

Nelly Sabde - Les Conférenciers`);

    // Pre-fill CC: speaker email for client tab, client email for speaker tab
    const speakerEmail = speaker?.email || "";
    setLiaisonClientCc(speakerEmail);
    setLiaisonSpeakerCc("");

    setLiaisonDialogOpen(true);
  };

  const handleSendLiaisonSheet = async () => {
    setSendingLiaison(true);
    const speaker = getSelectedSpeakerInfo();
    const speakerName = speaker?.name || "";
    const dateStr = contract?.event_date ? new Date(contract.event_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

    // Build liaison sheet content block
    const liaisonContent = `

📋 FEUILLE DE LIAISON
${event?.event_title ? `\nÉvénement : ${event.event_title}` : ""}
📅 Date de l'évènement : ${dateStr}
📍 Lieu de l'intervention : ${contract?.event_location || ""}
🕐 Horaires de l'intervention : ${contract?.event_time || ""}
${event?.conference_title ? `🎤 Conférence : ${event.conference_title}` : ""}
${event?.conference_duration ? `⏱ Durée : ${event.conference_duration}` : ""}
👥 Auditoire : ${event?.audience_size || ""}
📋 Thématique : ${event?.theme || ""}
${event?.dress_code ? `👔 Dress code : ${event.dress_code}` : ""}
🚗 Arrivée du conférencier sur place : ${liaisonArrival || "à confirmer"}
${event?.parking_info ? `🅿️ Parking : ${event.parking_info}` : ""}
${event?.hotel_info ? `🏨 Hôtel : ${event.hotel_info}` : ""}

🔧 Besoins techniques :
${liaisonTechNeeds ? `- ${liaisonTechNeeds}` : ""}
${liaisonSalleSetup ? `- ${liaisonSalleSetup}` : ""}

👤 Contact client : ${event?.contact_on_site_name || proposal.recipient_name || proposal.client_name}${event?.contact_on_site_phone ? ` - ${event.contact_on_site_phone}` : ""} - ${event?.contact_on_site_email || proposal.client_email}
🎤 Contact conférencier : ${speakerName}${speaker?.phone ? ` - ${speaker.phone}` : ""}
${event?.special_requests ? `\n📝 Remarques :\n${event.special_requests}` : ""}
${liaisonNotes ? `\n💬 Commentaires :\n${liaisonNotes}` : ""}`;

    const clientCcList = liaisonClientCc.split(",").map(e => e.trim()).filter(Boolean);
    const speakerCcList = liaisonSpeakerCc.split(",").map(e => e.trim()).filter(Boolean);

    try {
      // Send to client
      await supabase.functions.invoke("send-contact-email", {
        body: {
          to: proposal.client_email,
          subject: liaisonClientSubject,
          body: liaisonClientBody + liaisonContent,
          from_name: "Les Conférenciers",
          cc: clientCcList.length > 0 ? clientCcList : undefined,
        },
      });

      // Send to speaker if has email
      const speakerEmail = speaker?.email;
      if (speakerEmail) {
        await supabase.functions.invoke("send-contact-email", {
          body: {
            to: speakerEmail,
            subject: liaisonSpeakerSubject,
            body: liaisonSpeakerBody + liaisonContent,
            from_name: "Les Conférenciers",
            cc: speakerCcList.length > 0 ? speakerCcList : undefined,
          },
        });
      }

      // Track
      if (event) {
        await supabase.from("events").update({ liaison_sheet_sent_at: new Date().toISOString() } as any).eq("id", event.id);
      }
      toast.success("Feuille de liaison envoyée !");
      setLiaisonDialogOpen(false);
      fetchData();
    } catch { toast.error("Erreur d'envoi"); }
    setSendingLiaison(false);
  };

  // ─── Event edit ───
  const openEventEdit = () => {
    setEditBdcNumber(event?.bdc_number || "");
    setEditAudienceSize(event?.audience_size || "");
    setEditTheme(event?.theme || "");
    setEditSpeakerBudget(event?.speaker_budget || "");
    setEditVisioDate(event?.visio_date || "");
    setEditVisioTime(event?.visio_time || "");
    setEditVisioNotes(event?.visio_notes || "");
    setEditEventNotes(event?.notes || "");
    setEditEventTitle(event?.event_title || "");
    setEditContactOnSiteName(event?.contact_on_site_name || "");
    setEditContactOnSitePhone(event?.contact_on_site_phone || "");
    setEditContactOnSiteEmail(event?.contact_on_site_email || "");
    setEditTechNeeds(event?.tech_needs || "");
    setEditRoomSetup(event?.room_setup || "");
    setEditArrivalInfo(event?.arrival_info || "");
    setEditDressCode(event?.dress_code || "");
    setEditSpecialRequests(event?.special_requests || "");
    setEditConferenceTitle(event?.conference_title || "");
    setEditConferenceDuration(event?.conference_duration || "");
    setEditParkingInfo(event?.parking_info || "");
    setEditHotelInfo(event?.hotel_info || "");
    setEventEditOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!event) return;
    const { error } = await supabase.from("events").update({
      bdc_number: editBdcNumber || null,
      audience_size: editAudienceSize || null,
      theme: editTheme || null,
      speaker_budget: editSpeakerBudget || null,
      visio_date: editVisioDate || null,
      visio_time: editVisioTime || null,
      visio_notes: editVisioNotes || null,
      notes: editEventNotes || null,
      event_title: editEventTitle || null,
      contact_on_site_name: editContactOnSiteName || null,
      contact_on_site_phone: editContactOnSitePhone || null,
      contact_on_site_email: editContactOnSiteEmail || null,
      tech_needs: editTechNeeds || null,
      room_setup: editRoomSetup || null,
      arrival_info: editArrivalInfo || null,
      dress_code: editDressCode || null,
      special_requests: editSpecialRequests || null,
      conference_title: editConferenceTitle || null,
      conference_duration: editConferenceDuration || null,
      parking_info: editParkingInfo || null,
      hotel_info: editHotelInfo || null,
    } as any).eq("id", event.id);
    if (error) toast.error("Erreur"); else toast.success("Dossier mis à jour");
    setEventEditOpen(false);
    fetchData();
  };

  // ─── Visio quick save ───
  const handleSaveVisioQuick = async () => {
    if (!event) return;
    const dateStr = visioQuickDate ? visioQuickDate.toISOString().split("T")[0] : null;
    await supabase.from("events").update({
      visio_date: dateStr,
      visio_time: visioQuickTime || null,
    } as any).eq("id", event.id);
    toast.success("Visio enregistrée");
    fetchData();
  };

  // ─── Invoices ───
  const handleCreateInvoice = async () => {
    setCreatingInvoice(true);
    const multiplier = invoiceType === "total" ? 1 : 0.5;
    const amountHT = totalHTAfterDiscount * multiplier;
    const tvaRate = 20;
    const amountTTC = amountHT * (1 + tvaRate / 100);
    const { error } = await supabase.from("invoices").insert({
      proposal_id: proposal.id,
      contract_id: contract?.id || null,
      invoice_number: "",
      invoice_type: invoiceType,
      amount_ht: Math.round(amountHT * 100) / 100,
      tva_rate: tvaRate,
      amount_ttc: Math.round(amountTTC * 100) / 100,
      due_date: dueDate || null,
    });
    if (error) { toast.error("Erreur"); console.error(error); } else {
      toast.success("Facture créée !");
      setInvoiceDialogOpen(false); setDueDate(""); fetchData();
    }
    setCreatingInvoice(false);
  };

  const openEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv); setEditAmountHT(inv.amount_ht); setEditTvaRate(inv.tva_rate); setEditDueDate(inv.due_date || "");
    setEditInvoiceOpen(true);
  };

  const handleSaveInvoice = async () => {
    if (!editingInvoice) return;
    const amountTTC = editAmountHT * (1 + editTvaRate / 100);
    await supabase.from("invoices").update({
      amount_ht: Math.round(editAmountHT * 100) / 100,
      tva_rate: editTvaRate,
      amount_ttc: Math.round(amountTTC * 100) / 100,
      due_date: editDueDate || null,
    }).eq("id", editingInvoice.id);
    toast.success("Facture mise à jour !");
    setEditInvoiceOpen(false); fetchData();
  };

  const openInvoiceEmail = (inv: Invoice) => {
    setEmailInvoice(inv);
    const typeLabel = inv.invoice_type === "acompte" ? "d'acompte" : inv.invoice_type === "solde" ? "de solde" : "";
    const isDepositInvoice = inv.invoice_type === "acompte";
    
    setInvoiceEmailSubject(`Facture ${typeLabel} ${inv.invoice_number} - ${proposal.client_name}`);
    
    if (isDepositInvoice) {
      setInvoiceEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Veuillez trouver ci-dessous votre facture ${typeLabel} pour la prestation de conférence.

📄 Facture n° ${inv.invoice_number}
• Conférencier(s) : ${speakerSummary}
• Montant HT : ${inv.amount_ht.toLocaleString("fr-FR")} €
• TVA ${inv.tva_rate}% : ${(inv.amount_ttc - inv.amount_ht).toLocaleString("fr-FR")} €
• Montant TTC : ${inv.amount_ttc.toLocaleString("fr-FR")} €

👉 Cliquez sur le bouton ci-dessous pour consulter et télécharger votre facture.

Bien cordialement,
Nelly Sabde - Les Conférenciers`);
    } else {
      setInvoiceEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Avant toute chose, je tenais à vous remercier pour la confiance que vous m'avez accordée et pour la qualité de nos échanges lors de cette collaboration !

Vous trouverez ci-dessous la facture correspondant à l'intervention de ${speakerSummary}.

📄 Facture n° ${inv.invoice_number}
• Montant HT : ${inv.amount_ht.toLocaleString("fr-FR")} €
• TVA ${inv.tva_rate}% : ${(inv.amount_ttc - inv.amount_ht).toLocaleString("fr-FR")} €
• Montant TTC : ${inv.amount_ttc.toLocaleString("fr-FR")} €

Comme évoqué, je vous communique également un lien pour laisser un avis sur l'agence. Les retours des clients récents sont pour nous très précieux :
https://g.page/r/CZqRK1WOkub-EAI/review

👉 Cliquez sur le bouton ci-dessous pour consulter la facture.

Je reste bien évidemment à votre disposition pour toute nouvelle recherche d'intervenant.

Au plaisir de futurs échanges.

Très belle journée à vous,
Nelly Sabde - Les Conférenciers`);
    }
    setInvoiceEmailOpen(true);
  };

  const handleSendInvoiceEmail = async () => {
    if (!emailInvoice) return;
    setSendingInvoice(true);
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoice_id: emailInvoice.id, email_subject: invoiceEmailSubject, email_body: invoiceEmailBody },
      });
      if (error) throw error;
      await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", emailInvoice.id);
      toast.success(`Facture ${emailInvoice.invoice_number} envoyée !`);
      setInvoiceEmailOpen(false); fetchData();
    } catch { toast.error("Erreur d'envoi"); }
    setSendingInvoice(false);
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoice.id);
    toast.success(`Facture ${invoice.invoice_number} marquée payée`);
    fetchData(); onUpdate();
  };

  const handleMarkUnpaid = async (invoice: Invoice) => {
    await supabase.from("invoices").update({ status: "sent", paid_at: null }).eq("id", invoice.id);
    toast.success(`Facture ${invoice.invoice_number} remise en attente`);
    fetchData(); onUpdate();
  };

  const handleMarkSpeakerPaid = async () => {
    if (!event) return;
    await supabase.from("events").update({ speaker_paid_at: new Date().toISOString() } as any).eq("id", event.id);
    toast.success("Conférencier marqué comme payé");
    fetchData();
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const getContractSignUrl = () =>
    contract?.token ? `${window.location.origin}/signer-contrat/${contract.token}` : null;

  const dialogTotals = computeTotals(contractLines, discountPercent);

  if (loading) return <div className="text-muted-foreground text-xs py-2">Chargement…</div>;

  // ─── Tracking Dashboard ───
  // Each step can be toggled manually via clicking
  const steps = [
    { label: "Contrat client", done: contract?.status === "sent" || contract?.status === "signed", date: contract?.created_at, toggleKey: null as string | null },
    { label: "Info conférencier", done: !!event?.info_sent_speaker_at, date: event?.info_sent_speaker_at, toggleKey: "info_sent_speaker_at" },
    { label: "Contrat signé", done: contract?.status === "signed", date: contract?.signed_at, toggleKey: null },
    { label: "Facture acompte", done: invoices.some(i => i.invoice_type === "acompte" && (i.status === "sent" || i.status === "paid")), date: invoices.find(i => i.invoice_type === "acompte")?.sent_at, toggleKey: null },
    { label: "Visio prépa", done: !!event?.visio_date, date: event?.visio_date, toggleKey: null },
    { label: "Feuille liaison", done: !!event?.liaison_sheet_sent_at, date: event?.liaison_sheet_sent_at, toggleKey: "liaison_sheet_sent_at" },
    { label: "Facture finale", done: invoices.some(i => (i.invoice_type === "solde" || i.invoice_type === "total") && (i.status === "sent" || i.status === "paid")), date: invoices.find(i => i.invoice_type === "solde" || i.invoice_type === "total")?.sent_at, toggleKey: null },
    { label: "Conf. payé", done: !!event?.speaker_paid_at, date: event?.speaker_paid_at, toggleKey: "speaker_paid_at" },
  ];

  const handleToggleStep = async (step: typeof steps[0]) => {
    if (!event || !step.toggleKey) return;
    const newValue = step.done ? null : new Date().toISOString();
    await supabase.from("events").update({ [step.toggleKey]: newValue } as any).eq("id", event.id);
    toast.success(step.done ? `"${step.label}" décoché` : `"${step.label}" coché`);
    fetchData();
    onUpdate();
  };

  return (
    <div className="space-y-6 mt-4 border-t border-border pt-4">

      {/* ─── Speaker Selector ─── */}
      {proposal.proposal_speakers.length > 1 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <Label className="text-xs font-semibold flex items-center gap-2 mb-2">
            <User className="h-4 w-4" /> Conférencier retenu pour la prestation
          </Label>
          <div className="flex flex-wrap gap-2">
            {proposal.proposal_speakers.map(ps => {
              const isSelected = event?.selected_speaker_id === ps.speaker_id;
              return (
                <button
                  key={ps.speaker_id}
                  onClick={() => ps.speaker_id && handleSelectSpeaker(ps.speaker_id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm"
                      : "border-border bg-background hover:border-primary/50 text-foreground"
                  )}
                >
                  <span>{ps.speakers?.name || "—"}</span>
                  {ps.speakers?.email && (
                    <span className={cn("text-[10px]", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      ({ps.speakers.email})
                    </span>
                  )}
                  {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
          {event?.selected_speaker_id && speakerInfo && (
            <p className="text-[10px] text-muted-foreground mt-2">
              📧 Email : {speakerInfo.email || "non renseigné"} · 📞 Tél : {speakerInfo.phone || "non renseigné"}
            </p>
          )}
        </div>
      )}

      {/* Single speaker display */}
      {proposal.proposal_speakers.length === 1 && speakerInfo && (
        <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">{speakerInfo.name}</span>
            <span className="text-muted-foreground text-xs ml-2">
              📧 {speakerInfo.email || "—"} · 📞 {speakerInfo.phone || "—"}
            </span>
          </div>
        </div>
      )}

      {/* ─── Tracking Dashboard ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Suivi du dossier
          {event?.bdc_number && <span className="text-xs font-normal text-muted-foreground">BDC n° {event.bdc_number}</span>}
        </h3>
        <Button size="sm" variant="ghost" onClick={openEventEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {steps.map((step, i) => {
          const isClickable = !!step.toggleKey;
          const stepClasses = `text-center p-2 rounded-lg border text-[10px] leading-tight ${
            step.done
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-muted/30 border-border text-muted-foreground"
          } ${isClickable ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`;
          const stepContent = (
            <>
              <div className="text-base mb-0.5">{step.done ? "✓" : "○"}</div>
              <div className="font-medium">{step.label}</div>
              {step.done && step.date && (
                <div className="text-[8px] mt-0.5 opacity-70">
                  {new Date(step.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </div>
              )}
            </>
          );

          // Visio step gets a Calendar popover
          if (i === 4) {
            return (
              <Popover key={i}>
                <PopoverTrigger asChild>
                  <button className={cn(stepClasses, "cursor-pointer hover:border-primary/50 transition-colors")}>
                    {stepContent}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 space-y-3" align="center">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" /> Visio préparatoire
                  </Label>
                  <Calendar
                    mode="single"
                    selected={visioQuickDate}
                    onSelect={setVisioQuickDate}
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Heure</Label>
                    <Input value={visioQuickTime} onChange={e => setVisioQuickTime(e.target.value)} placeholder="10h00" className="h-8 text-sm" />
                  </div>
                  <Button size="sm" className="w-full" onClick={handleSaveVisioQuick}>Enregistrer</Button>
                </PopoverContent>
              </Popover>
            );
          }

          // Toggleable steps
          if (isClickable) {
            return (
              <button key={i} className={stepClasses} onClick={() => handleToggleStep(step)} title={`Cliquer pour ${step.done ? "décocher" : "cocher"}`}>
                {stepContent}
              </button>
            );
          }

          return (
            <div key={i} className={stepClasses}>
              {stepContent}
            </div>
          );
        })}
      </div>

      {/* Event details summary */}
      {event && (event.audience_size || event.theme || event.visio_date || event.event_title || event.contact_on_site_name || event.conference_title) && (
        <div className="bg-muted/20 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {event.event_title && <div><span className="text-muted-foreground">Événement :</span> {event.event_title}</div>}
            {event.conference_title && <div><span className="text-muted-foreground">Conférence :</span> {event.conference_title}</div>}
            {event.conference_duration && <div><span className="text-muted-foreground">Durée :</span> {event.conference_duration}</div>}
            {event.audience_size && <div><span className="text-muted-foreground">Auditoire :</span> {event.audience_size}</div>}
            {event.theme && <div><span className="text-muted-foreground">Thématique :</span> {event.theme}</div>}
            {event.speaker_budget && <div><span className="text-muted-foreground">Budget speaker :</span> {event.speaker_budget.toLocaleString("fr-FR")} €</div>}
            {event.visio_date && <div><span className="text-muted-foreground">Visio :</span> {formatDate(event.visio_date)} {event.visio_time || ""}</div>}
            {event.dress_code && <div><span className="text-muted-foreground">Dress code :</span> {event.dress_code}</div>}
          </div>
          {(event.contact_on_site_name || event.tech_needs || event.arrival_info) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs border-t border-border/50 pt-2">
              {event.contact_on_site_name && <div><span className="text-muted-foreground">Contact sur place :</span> {event.contact_on_site_name} {event.contact_on_site_phone ? `(${event.contact_on_site_phone})` : ""}</div>}
              {event.tech_needs && <div><span className="text-muted-foreground">Technique :</span> {event.tech_needs}</div>}
              {event.arrival_info && <div><span className="text-muted-foreground">Arrivée :</span> {event.arrival_info}</div>}
              {event.parking_info && <div><span className="text-muted-foreground">Parking :</span> {event.parking_info}</div>}
              {event.hotel_info && <div><span className="text-muted-foreground">Hôtel :</span> {event.hotel_info}</div>}
            </div>
          )}
        </div>
      )}

      {/* ─── Contract Section ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contrat client
        </h3>
        {!contract ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openCreateContract}>
            <Plus className="h-3 w-3" /> Créer le contrat
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              contract.status === "signed" ? "bg-green-100 text-green-700" :
              contract.status === "sent" ? "bg-amber-100 text-amber-700" :
              "bg-muted text-muted-foreground"
            }`}>
              {contract.status === "signed" ? `✓ Signé${contract.signer_name ? ` par ${contract.signer_name}` : ""}` :
               contract.status === "sent" ? "Envoyé" : "Brouillon"}
            </span>
            {(contract.status === "draft" || contract.status === "sent") && (
              <>
                <Button size="sm" variant="ghost" onClick={openEditContract}><Pencil className="h-3 w-3" /></Button>
                {contract.status === "draft" && (
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={openContractEmail}>
                    <Send className="h-3 w-3" /> Envoyer
                  </Button>
                )}
              </>
            )}
            <Button size="sm" variant="ghost" asChild>
              <a href={`/admin/contrat/${contract.id}`} target="_blank" rel="noopener noreferrer" className="gap-1">
                <Printer className="h-3 w-3" /> Voir
              </a>
            </Button>
          </div>
        )}
      </div>

      {contract?.status === "signed" && contract.signed_at && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
          ✓ Contrat signé le {formatDate(contract.signed_at)} par <strong>{contract.signer_name}</strong>
        </div>
      )}

      {/* ─── Speaker Communication ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4" /> Communication conférencier
          {speakerInfo && <span className="text-xs font-normal text-muted-foreground">- {speakerInfo.name}</span>}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openSpeakerEmail("info")}>
            <Send className="h-3 w-3" /> Envoyer les infos
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openSpeakerEmail("contract")}>
            <FileText className="h-3 w-3" /> Envoyer contrat
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={`/admin/contrat-conferencier/${proposal.id}`} target="_blank" rel="noopener noreferrer" className="gap-1">
              <Eye className="h-3 w-3" /> Voir BDC
            </a>
          </Button>
        </div>
      </div>

      {(event?.info_sent_speaker_at || event?.contract_sent_speaker_at) && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          {event?.info_sent_speaker_at && <span>📧 Infos envoyées le {formatDate(event.info_sent_speaker_at)}</span>}
          {event?.contract_sent_speaker_at && <span>📄 Contrat envoyé le {formatDate(event.contract_sent_speaker_at)}</span>}
        </div>
      )}

      {/* ─── Liaison Sheet ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Feuille de liaison
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={openLiaisonDialog}>
            <Send className="h-3 w-3" /> {event?.liaison_sheet_sent_at ? "Renvoyer" : "Envoyer"}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={`/admin/feuille-liaison/${proposal.id}`} target="_blank" rel="noopener noreferrer" className="gap-1">
              <Eye className="h-3 w-3" /> Voir
            </a>
          </Button>
        </div>
      </div>

      {event?.liaison_sheet_sent_at && (
        <div className="text-xs text-muted-foreground">✓ Envoyée le {formatDate(event.liaison_sheet_sent_at)}</div>
      )}

      {/* ─── Invoices ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Factures
        </h3>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInvoiceDialogOpen(true)}>
          <Plus className="h-3 w-3" /> Créer une facture
        </Button>
      </div>

      {invoices.length > 0 && (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className={`border rounded-lg p-4 ${
              inv.status === "paid" ? "border-green-200 bg-green-50/50" :
              inv.status === "sent" ? "border-amber-200 bg-amber-50/30" : "border-border"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">{inv.invoice_number}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {inv.invoice_type === "acompte" ? "Acompte 50%" : inv.invoice_type === "solde" ? "Solde 50%" : "Total"}
                  </span>
                </div>
                <span className="text-sm font-bold">{inv.amount_ttc.toLocaleString("fr-FR")} € TTC</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {inv.status === "paid" ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Payée le {formatDate(inv.paid_at)}
                    </span>
                  ) : inv.status === "sent" ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                      <CircleDollarSign className="h-3 w-3" /> En attente
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">Brouillon</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {inv.status === "draft" && <Button size="sm" variant="ghost" onClick={() => openEditInvoice(inv)}><Pencil className="h-3 w-3" /></Button>}
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/admin/facture/${inv.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                  </Button>
                  {inv.status === "draft" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openInvoiceEmail(inv)}>
                      <Send className="h-3 w-3" /> Envoyer
                    </Button>
                  )}
                  {inv.status === "sent" && (
                    <Button size="sm" className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleMarkPaid(inv)}>
                      <CheckCircle className="h-3 w-3" /> Payée
                    </Button>
                  )}
                  {inv.status === "paid" && (
                    <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground" onClick={() => handleMarkUnpaid(inv)}>
                      <Ban className="h-3 w-3" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Aucune facture créée</p>}

      {/* ─── Speaker Payment ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4" /> Règlement conférencier
        </h3>
        {event?.speaker_paid_at ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            ✓ Payé le {formatDate(event.speaker_paid_at)}
          </span>
        ) : (
          <Button size="sm" className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleMarkSpeakerPaid}>
            <CheckCircle className="h-3 w-3" /> Marquer payé
          </Button>
        )}
      </div>

      {/* ═══ DIALOGS ═══ */}

      {/* Contract form dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingContract ? "Modifier" : "Créer"} le contrat - {proposal.client_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Client selector - mandatory */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Client (obligatoire pour le contrat) *
              </Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
                  value={contractClientId}
                  onChange={e => {
                    if (e.target.value === "__new__") {
                      setShowCreateClientInContract(true);
                      setContractClientId("");
                    } else {
                      setContractClientId(e.target.value);
                      setShowCreateClientInContract(false);
                    }
                  }}
                >
                  <option value="">- Sélectionner un client -</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}{c.contact_name ? ` - ${c.contact_name}` : ""}{c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                  <option value="__new__">➕ Créer un nouveau client…</option>
                </select>
              </div>
              {!contractClientId && !showCreateClientInContract && (
                <p className="text-[10px] text-destructive">⚠ Un client doit être sélectionné pour éditer le bon de commande</p>
              )}

              {showCreateClientInContract && (
                <div className="border border-primary/30 rounded-lg p-3 space-y-3 bg-primary/5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Nouveau client
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Société *</Label>
                      <Input value={newContractClientCompany} onChange={e => setNewContractClientCompany(e.target.value)} placeholder="SNCF" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Nom du contact</Label>
                      <Input value={newContractClientContact} onChange={e => setNewContractClientContact(e.target.value)} placeholder="Pascal Dupont" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Email *</Label>
                      <Input type="email" value={newContractClientEmail} onChange={e => setNewContractClientEmail(e.target.value)} placeholder="email@societe.com" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Téléphone</Label>
                      <Input value={newContractClientPhone} onChange={e => setNewContractClientPhone(e.target.value)} placeholder="06 XX XX XX XX" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">SIRET</Label>
                      <Input value={newContractClientSiret} onChange={e => setNewContractClientSiret(e.target.value)} placeholder="123 456 789 00012" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Ville</Label>
                      <Input value={newContractClientCity} onChange={e => setNewContractClientCity(e.target.value)} placeholder="Paris" className="h-8 text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Adresse</Label>
                      <Input value={newContractClientAddress} onChange={e => setNewContractClientAddress(e.target.value)} placeholder="12 rue de la Paix" className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateContractClient} disabled={creatingClient} className="gap-1">
                      <UserPlus className="h-3 w-3" /> {creatingClient ? "Création…" : "Créer et sélectionner"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreateClientInContract(false)}>Annuler</Button>
                  </div>
                </div>
              )}

              {/* Show selected client info */}
              {contractClientId && (() => {
                const c = clients.find(cl => cl.id === contractClientId);
                return c ? (
                  <div className="text-[10px] text-muted-foreground space-y-0.5 bg-background p-2 rounded border border-border/50">
                    <p><strong>{c.company_name}</strong>{c.contact_name ? ` - ${c.contact_name}` : ""}</p>
                    {c.email && <p>📧 {c.email}</p>}
                    {c.siret && <p>🏢 SIRET : {c.siret}</p>}
                    {c.address && <p>📍 {c.address}{c.city ? `, ${c.city}` : ""}</p>}
                  </div>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Horaires</Label><Input placeholder="14h00 - 15h30" value={eventTime} onChange={e => setEventTime(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Lieu</Label><Input placeholder="Hôtel Marriott, Paris" value={eventLocation} onChange={e => setEventLocation(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Taille de l'auditoire</Label><Input placeholder="200 personnes" value={contractAudienceSize} onChange={e => setContractAudienceSize(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">N° Bon de commande</Label><Input placeholder="BDC-001" value={contractBdcNumber} onChange={e => setContractBdcNumber(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Format</Label><Input placeholder="Conférence, Table ronde..." value={eventFormat} onChange={e => setEventFormat(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Détails</Label><Textarea placeholder="Infos complémentaires..." value={eventDescription} onChange={e => setEventDescription(e.target.value)} rows={2} /></div>

            {/* Lines */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Lignes de facturation</Label>
              {contractLines.map(line => (
                <div key={line.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex-1 space-y-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      line.type === "speaker" ? "bg-primary/10 text-primary" :
                      line.type === "travel" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>{line.type === "speaker" ? "Conférencier" : line.type === "travel" ? "Déplacement" : "Autre"}</span>
                    <Input value={line.label} onChange={e => updateLine(line.id, "label", e.target.value)} className="h-8 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Montant HT (€)</Label>
                        <Input type="number" value={line.amount_ht} onChange={e => updateLine(line.id, "amount_ht", Number(e.target.value))} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">TVA</Label>
                        <Select value={String(line.tva_rate)} onValueChange={v => updateLine(line.id, "tva_rate", Number(v))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{TVA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive mt-6" onClick={() => removeLine(line.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addLine("speaker")}><Plus className="h-3 w-3" /> Conférencier</Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addLine("travel")}><Plus className="h-3 w-3" /> Déplacement</Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addLine("custom")}><Plus className="h-3 w-3" /> Autre</Button>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1"><Label className="text-xs">Remise globale (%)</Label></div>
              <Input type="number" min={0} max={100} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} className="w-20 h-8 text-sm text-right" />
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Sous-total HT</span><span>{dialogTotals.subtotalHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
              {discountPercent > 0 && <div className="flex justify-between text-red-600"><span>Remise ({discountPercent}%)</span><span>-{dialogTotals.discountAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Total HT</span><span>{dialogTotals.totalHTAfterDiscount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
              <div className="flex justify-between text-muted-foreground"><span>TVA</span><span>{dialogTotals.totalTVA.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base"><span>Total TTC</span><span>{dialogTotals.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
            </div>

            <Button className="w-full" onClick={handleSaveContract} disabled={saving}>
              {saving ? "Sauvegarde…" : editingContract ? "Mettre à jour" : "Créer le contrat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract email dialog with client selector */}
      <Dialog open={contractEmailOpen} onOpenChange={setContractEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Envoyer le contrat - {proposal.client_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">

            {/* Client contact selector */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Destinataire du contrat
              </Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
                  value={selectedClientId}
                  onChange={e => {
                    if (e.target.value === "__new__") {
                      setShowCreateClient(true);
                      setSelectedClientId("");
                    } else if (e.target.value) {
                      handleSelectClient(e.target.value);
                    } else {
                      setSelectedClientId("");
                      setContractRecipientName(proposal.recipient_name || "");
                      setContractRecipientEmail(proposal.client_email);
                    }
                  }}
                >
                  <option value="">- Utiliser les infos de la proposition -</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}{c.contact_name ? ` - ${c.contact_name}` : ""}{c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                  <option value="__new__">➕ Créer un nouveau client…</option>
                </select>
              </div>

              {/* Inline create client form */}
              {showCreateClient && (
                <div className="border border-primary/30 rounded-lg p-3 space-y-3 bg-primary/5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Nouveau client
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Société *</Label>
                      <Input value={newClientCompany} onChange={e => setNewClientCompany(e.target.value)} placeholder="SNCF" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Nom du contact</Label>
                      <Input value={newClientContact} onChange={e => setNewClientContact(e.target.value)} placeholder="Pascal Dupont" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Email</Label>
                      <Input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="email@societe.com" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Téléphone</Label>
                      <Input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="06 XX XX XX XX" className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateNewClient} disabled={creatingClient} className="gap-1">
                      <UserPlus className="h-3 w-3" /> {creatingClient ? "Création…" : "Créer et sélectionner"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreateClient(false)}>Annuler</Button>
                  </div>
                </div>
              )}

              {/* Editable recipient fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Nom du destinataire</Label>
                  <Input value={contractRecipientName} onChange={e => setContractRecipientName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Email du destinataire</Label>
                  <Input type="email" value={contractRecipientEmail} onChange={e => setContractRecipientEmail(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-2"><Label className="text-xs">Objet</Label><Input value={contractEmailSubject} onChange={e => setContractEmailSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label className="text-xs">Corps du mail</Label><Textarea value={contractEmailBody} onChange={e => setContractEmailBody(e.target.value)} rows={12} className="text-sm" /></div>

            {/* Recap */}
            <div className="bg-muted/30 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
              <p>📧 <strong>Destinataire :</strong> {contractRecipientName || "—"} &lt;{contractRecipientEmail || "—"}&gt;</p>
              <p>🎤 <strong>Conférencier :</strong> {speakerSummary}</p>
              {getContractSignUrl() && <p>🔗 <strong>Lien signature :</strong> {getContractSignUrl()}</p>}
            </div>

            <Button className="w-full" onClick={handleSendContractEmail} disabled={sendingContract}>
              <Send className="h-4 w-4 mr-2" />{sendingContract ? "Envoi…" : "Envoyer le contrat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Speaker email dialog */}
      <Dialog open={speakerEmailOpen} onOpenChange={setSpeakerEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {speakerEmailType === "info" ? "Envoyer les infos" : "Envoyer le contrat"} au conférencier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-xs">Objet</Label><Input value={speakerEmailSubject} onChange={e => setSpeakerEmailSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label className="text-xs">Corps du mail</Label><Textarea value={speakerEmailBody} onChange={e => setSpeakerEmailBody(e.target.value)} rows={12} className="text-sm" /></div>
            <p className="text-[10px] text-muted-foreground">
              📧 Sera envoyé à : {speakerInfo?.email || "Pas d'email renseigné"}
            </p>
            <Button className="w-full" onClick={handleSendSpeakerEmail} disabled={sendingSpeakerEmail}>
              <Send className="h-4 w-4 mr-2" />{sendingSpeakerEmail ? "Envoi…" : "Envoyer au conférencier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liaison sheet dialog */}
      <Dialog open={liaisonDialogOpen} onOpenChange={setLiaisonDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Feuille de liaison - {proposal.client_name}</DialogTitle></DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Liaison details - matching the DOCX template fields */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-xs font-semibold">📋 Champs de la feuille de liaison</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Arrivée du conférencier sur place</Label><Input value={liaisonArrival} onChange={e => setLiaisonArrival(e.target.value)} placeholder="environ 10H" className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Besoins techniques</Label><Input value={liaisonTechNeeds} onChange={e => setLiaisonTechNeeds(e.target.value)} placeholder="Vidéoprojecteur" className="h-8 text-sm" /></div>
              </div>
              <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Configuration de la salle</Label><Input value={liaisonSalleSetup} onChange={e => setLiaisonSalleSetup(e.target.value)} placeholder="Salle en largeur avec allée centrale" className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Commentaires</Label><Textarea value={liaisonNotes} onChange={e => setLiaisonNotes(e.target.value)} rows={2} className="text-sm" placeholder="Le conférencier restera pour le déjeuner..." /></div>
              
              {/* Preview of what the liaison sheet will contain */}
              <div className="bg-background rounded border border-border p-3 text-[11px] text-muted-foreground space-y-0.5">
                <p className="font-semibold text-foreground text-xs mb-1">Aperçu de la feuille :</p>
                <p>📅 Date : {contract?.event_date ? new Date(contract.event_date).toLocaleDateString("fr-FR") : "—"}</p>
                <p>📍 Lieu : {contract?.event_location || "—"}</p>
                <p>🕐 Horaires : {contract?.event_time || "—"}</p>
                <p>👥 Auditoire : {event?.audience_size || "—"}</p>
                <p>🎯 Thématique : {event?.theme || "—"}</p>
                <p>🚗 Arrivée : {liaisonArrival || "à confirmer"}</p>
                <p>🔧 Technique : {liaisonTechNeeds || "—"}{liaisonSalleSetup ? `, ${liaisonSalleSetup}` : ""}</p>
                <p>📞 Client : {proposal.recipient_name || proposal.client_name}</p>
                <p>📞 Conférencier : {speakerInfo?.name || "—"}{speakerInfo?.phone ? ` - ${speakerInfo.phone}` : ""}</p>
              </div>
            </div>

            {/* Email tabs */}
            <div className="flex gap-2">
              <button onClick={() => setLiaisonTab("client")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${liaisonTab === "client" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                📧 Email Client
              </button>
              <button onClick={() => setLiaisonTab("speaker")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${liaisonTab === "speaker" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                🎤 Email Conférencier
              </button>
            </div>

            {liaisonTab === "client" ? (
              <div className="space-y-3">
                <div className="space-y-1"><Label className="text-xs">Objet</Label><Input value={liaisonClientSubject} onChange={e => setLiaisonClientSubject(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Corps du mail</Label><Textarea value={liaisonClientBody} onChange={e => setLiaisonClientBody(e.target.value)} rows={10} className="text-sm" /></div>
                <div className="space-y-1">
                  <Label className="text-xs">CC (copie pour le mail client)</Label>
                  <Input value={liaisonClientCc} onChange={e => setLiaisonClientCc(e.target.value)} placeholder="conferencier@email.com" className="text-sm" />
                  <p className="text-[10px] text-muted-foreground">Séparez les adresses par une virgule</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1"><Label className="text-xs">Objet</Label><Input value={liaisonSpeakerSubject} onChange={e => setLiaisonSpeakerSubject(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Corps du mail</Label><Textarea value={liaisonSpeakerBody} onChange={e => setLiaisonSpeakerBody(e.target.value)} rows={10} className="text-sm" /></div>
                <div className="space-y-1">
                  <Label className="text-xs">CC (copie pour le mail conférencier)</Label>
                  <Input value={liaisonSpeakerCc} onChange={e => setLiaisonSpeakerCc(e.target.value)} placeholder="client@email.com" className="text-sm" />
                  <p className="text-[10px] text-muted-foreground">Séparez les adresses par une virgule</p>
                </div>
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
              <p>📧 <strong>Client :</strong> {proposal.client_email}{liaisonClientCc ? ` (CC: ${liaisonClientCc})` : ""}</p>
              <p>🎤 <strong>Conférencier :</strong> {speakerInfo?.email || "Pas d'email renseigné"}{liaisonSpeakerCc ? ` (CC: ${liaisonSpeakerCc})` : ""}</p>
            </div>

            <Button className="w-full" onClick={handleSendLiaisonSheet} disabled={sendingLiaison}>
              <Send className="h-4 w-4 mr-2" />{sendingLiaison ? "Envoi…" : "Envoyer la feuille de liaison"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event edit dialog */}
      <Dialog open={eventEditOpen} onOpenChange={setEventEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Suivi du dossier - {proposal.client_name}</DialogTitle></DialogHeader>
          <div className="space-y-5 mt-2">

            {/* Section: Événement */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">📋 Événement</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Titre de l'événement</Label><Input value={editEventTitle} onChange={e => setEditEventTitle(e.target.value)} placeholder="Séminaire annuel, Congrès RH…" /></div>
                <div className="space-y-1"><Label className="text-xs">N° BDC</Label><Input value={editBdcNumber} onChange={e => setEditBdcNumber(e.target.value)} placeholder="971" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Thématique</Label><Input value={editTheme} onChange={e => setEditTheme(e.target.value)} placeholder="Le management" /></div>
                <div className="space-y-1"><Label className="text-xs">Auditoire</Label><Input value={editAudienceSize} onChange={e => setEditAudienceSize(e.target.value)} placeholder="100 personnes" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Dress code</Label><Input value={editDressCode} onChange={e => setEditDressCode(e.target.value)} placeholder="Tenue de ville, casual…" /></div>
            </div>

            {/* Section: Conférence */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">🎤 Conférence</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Titre de la conférence</Label><Input value={editConferenceTitle} onChange={e => setEditConferenceTitle(e.target.value)} placeholder="L'Art du Leadership" /></div>
                <div className="space-y-1"><Label className="text-xs">Durée</Label><Input value={editConferenceDuration} onChange={e => setEditConferenceDuration(e.target.value)} placeholder="1h00, 1h30…" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Budget conférencier (€ HT)</Label><Input type="number" value={editSpeakerBudget} onChange={e => setEditSpeakerBudget(e.target.value ? Number(e.target.value) : "")} /></div>
            </div>

            {/* Section: Contact sur place */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">👤 Contact sur place (client)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">Nom</Label><Input value={editContactOnSiteName} onChange={e => setEditContactOnSiteName(e.target.value)} placeholder="Marie Dupont" /></div>
                <div className="space-y-1"><Label className="text-xs">Téléphone</Label><Input value={editContactOnSitePhone} onChange={e => setEditContactOnSitePhone(e.target.value)} placeholder="06 XX XX XX XX" /></div>
                <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={editContactOnSiteEmail} onChange={e => setEditContactOnSiteEmail(e.target.value)} placeholder="marie@societe.com" /></div>
              </div>
            </div>

            {/* Section: Logistique */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">🚗 Logistique</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Arrivée / accueil</Label><Input value={editArrivalInfo} onChange={e => setEditArrivalInfo(e.target.value)} placeholder="Accueil à 9h00 hall A" /></div>
                <div className="space-y-1"><Label className="text-xs">Parking</Label><Input value={editParkingInfo} onChange={e => setEditParkingInfo(e.target.value)} placeholder="Parking souterrain, badge à l'accueil" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Hôtel</Label><Input value={editHotelInfo} onChange={e => setEditHotelInfo(e.target.value)} placeholder="Hôtel Marriott - réservation confirmée" /></div>
            </div>

            {/* Section: Technique */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">🔧 Technique & salle</Label>
              <div className="space-y-1"><Label className="text-xs">Besoins techniques</Label><Textarea value={editTechNeeds} onChange={e => setEditTechNeeds(e.target.value)} rows={2} placeholder="Micro HF, écran, clicker…" /></div>
              <div className="space-y-1"><Label className="text-xs">Configuration de salle</Label><Textarea value={editRoomSetup} onChange={e => setEditRoomSetup(e.target.value)} rows={2} placeholder="En théâtre, 200 places, scène…" /></div>
            </div>

            {/* Section: Visio prépa */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">📹 Visio préparatoire</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Date visio</Label><Input type="date" value={editVisioDate} onChange={e => setEditVisioDate(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Heure</Label><Input value={editVisioTime} onChange={e => setEditVisioTime(e.target.value)} placeholder="10h00" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Notes visio</Label><Textarea value={editVisioNotes} onChange={e => setEditVisioNotes(e.target.value)} rows={2} /></div>
            </div>

            {/* Section: Demandes spéciales */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">📝 Notes & demandes</Label>
              <div className="space-y-1"><Label className="text-xs">Demandes spéciales</Label><Textarea value={editSpecialRequests} onChange={e => setEditSpecialRequests(e.target.value)} rows={2} placeholder="Régime alimentaire, accessibilité…" /></div>
              <div className="space-y-1"><Label className="text-xs">Notes internes</Label><Textarea value={editEventNotes} onChange={e => setEditEventNotes(e.target.value)} rows={3} /></div>
            </div>

            <Button className="w-full" onClick={handleSaveEvent}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice creation dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">Créer une facture - {proposal.client_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs">Type de facture</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["acompte", "solde", "total"] as const).map(t => (
                  <button key={t} onClick={() => setInvoiceType(t)} className={`px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${invoiceType === t ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"}`}>
                    {t === "acompte" ? "Acompte 50%" : t === "solde" ? "Solde 50%" : "Total 100%"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Date d'échéance</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Montant HT</span><span>{(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total TTC</span><span>{(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5) * 1.2).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span></div>
            </div>
            <Button className="w-full" onClick={handleCreateInvoice} disabled={creatingInvoice}>
              {creatingInvoice ? "Création…" : "Créer la facture"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice edit dialog */}
      <Dialog open={editInvoiceOpen} onOpenChange={setEditInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">Modifier {editingInvoice?.invoice_number}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Montant HT (€)</Label><Input type="number" value={editAmountHT} onChange={e => setEditAmountHT(Number(e.target.value))} /></div>
              <div className="space-y-1">
                <Label className="text-xs">TVA</Label>
                <Select value={String(editTvaRate)} onValueChange={v => setEditTvaRate(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TVA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Date d'échéance</Label><Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} /></div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between font-bold">
              <span>Total TTC</span><span>{(editAmountHT * (1 + editTvaRate / 100)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
            </div>
            <Button className="w-full" onClick={handleSaveInvoice}>Mettre à jour</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice email dialog */}
      <Dialog open={invoiceEmailOpen} onOpenChange={setInvoiceEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Envoyer {emailInvoice?.invoice_number} - {proposal.client_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label className="text-xs">Objet</Label><Input value={invoiceEmailSubject} onChange={e => setInvoiceEmailSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label className="text-xs">Corps du mail</Label><Textarea value={invoiceEmailBody} onChange={e => setInvoiceEmailBody(e.target.value)} rows={12} className="text-sm" /></div>
            <p className="text-[10px] text-muted-foreground">📧 Sera envoyé à : {proposal.client_email}</p>
            <Button className="w-full" onClick={handleSendInvoiceEmail} disabled={sendingInvoice}>
              <Send className="h-4 w-4 mr-2" />{sendingInvoice ? "Envoi…" : `Envoyer la facture`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDossier;
