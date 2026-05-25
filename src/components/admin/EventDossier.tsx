import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Receipt,
  Plus,
  ExternalLink,
  Send,
  CheckCircle,
  Printer,
  Pencil,
  Ban,
  CircleDollarSign,
  Trash2,
  Percent,
  ClipboardList,
  Video,
  Mail,
  User,
  CalendarIcon,
  UserPlus,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_CLAUSES, type ClauseKey } from "@/lib/contractClauses";
import { cn } from "@/lib/utils";
import SignedContractUpload from "@/components/admin/SignedContractUpload";
import RichTextEditor from "@/components/admin/RichTextEditor";

const REMOVED_CLAUSE = "__REMOVED__";

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
  contract_sent_at?: string | null;
  contract_lines: any;
  discount_percent: number | null;
  agency_commission?: number | null;
  client_signed_received_at?: string | null;
  version?: number | null;
  replaces_contract_id?: string | null;
  superseded_at?: string | null;
  superseded_by_contract_id?: string | null;
};


type SpeakerCRM = {
  id: string;
  name: string;
  base_fee: number | null;
  email: string | null;
  phone: string | null;
  city: string | null;
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
  vhr_estimate?: number | null;
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
  liaison_email_client_sent_at: string | null;
  liaison_email_speaker_sent_at: string | null;
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
  logistics_info?: string | null;
  client_signed_received_at?: string | null;
  client_deposit_paid_at?: string | null;
  speaker_acknowledgment_at?: string | null;
  speaker_signed_contract_at?: string | null;
  speaker_deposit_paid_at?: string | null;
  client_invoice_sent_at?: string | null;
  client_invoice_paid_at?: string | null;
  event_date?: string | null;
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

const parseAmountInput = (value: string) => Number(value.replace(/\s/g, "").replace(",", ".")) || 0;

const EventDossier = ({ proposal, onUpdate }: Props) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [previousContracts, setPreviousContracts] = useState<Contract[]>([]);

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
  const [contractTheme, setContractTheme] = useState("");
  const [contractBdcNumber, setContractBdcNumber] = useState("");
  const [contractLines, setContractLines] = useState<ContractLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [agencyCommission, setAgencyCommission] = useState<number>(0);
  const [agencyCommissionText, setAgencyCommissionText] = useState("0");
  const [saving, setSaving] = useState(false);
  const [depositRequired, setDepositRequired] = useState(true);
  const [customClauses, setCustomClauses] = useState("");
  const [articleOverrides, setArticleOverrides] = useState<Record<string, string>>({});
  // CRM speaker picker for contract lines
  const [allSpeakers, setAllSpeakers] = useState<SpeakerCRM[]>([]);
  const [speakerPickerOpen, setSpeakerPickerOpen] = useState(false);
  const [speakerPickerSearch, setSpeakerPickerSearch] = useState("");
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
  // Inline edit of selected client inside contract dialog
  const [editClientInContract, setEditClientInContract] = useState(false);
  const [editClientCompany, setEditClientCompany] = useState("");
  const [editClientContact, setEditClientContact] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientSiret, setEditClientSiret] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");
  const [editClientCity, setEditClientCity] = useState("");
  const [savingClientEdit, setSavingClientEdit] = useState(false);

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
  const [speakerEmailTo, setSpeakerEmailTo] = useState("");
  const [speakerEmailCc, setSpeakerEmailCc] = useState("");
  const [speakerEmailSubject, setSpeakerEmailSubject] = useState("");
  const [speakerEmailBody, setSpeakerEmailBody] = useState("");
  const [sendingSpeakerEmail, setSendingSpeakerEmail] = useState(false);
  const [speakerEmailType, setSpeakerEmailType] = useState<"info" | "contract">("info");
  const [speakerEmailAddressing, setSpeakerEmailAddressing] = useState<"formal" | "informal">("formal");

  // Liaison sheet dialog
  const [liaisonDialogOpen, setLiaisonDialogOpen] = useState(false);
  const [liaisonNotes, setLiaisonNotes] = useState("");
  const [liaisonTechNeeds, setLiaisonTechNeeds] = useState("");
  const [liaisonArrival, setLiaisonArrival] = useState("");
  const [liaisonSalleSetup, setLiaisonSalleSetup] = useState("");
  // Liaison editable contract/event fields
  const [liaisonEventDate, setLiaisonEventDate] = useState("");
  const [liaisonEventLocation, setLiaisonEventLocation] = useState("");
  const [liaisonEventTime, setLiaisonEventTime] = useState("");
  const [liaisonAudience, setLiaisonAudience] = useState("");
  const [liaisonTheme, setLiaisonTheme] = useState("");
  const [sendingLiaison, setSendingLiaison] = useState(false);
  const [liaisonClientSubject, setLiaisonClientSubject] = useState("");
  const [liaisonClientBody, setLiaisonClientBody] = useState("");
  const [liaisonSpeakerSubject, setLiaisonSpeakerSubject] = useState("");
  const [liaisonSpeakerBody, setLiaisonSpeakerBody] = useState("");
  const [liaisonClientTo, setLiaisonClientTo] = useState("");
  const [liaisonSpeakerTo, setLiaisonSpeakerTo] = useState("");
  const [liaisonClientCc, setLiaisonClientCc] = useState("");
  const [liaisonSpeakerCc, setLiaisonSpeakerCc] = useState("");
  const [liaisonTab, setLiaisonTab] = useState<"client" | "speaker">("client");
  const [liaisonAddressing, setLiaisonAddressing] = useState<"formal" | "informal">("formal");

  // Visio quick picker
  const [visioQuickDate, setVisioQuickDate] = useState<Date | undefined>();
  const [visioQuickTime, setVisioQuickTime] = useState("");

  // Invoice form
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"acompte" | "solde" | "total">("total");
  const [dueDate, setDueDate] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Invoice edit
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editAmountHT, setEditAmountHT] = useState(0);
  const [editTvaRate, setEditTvaRate] = useState(20);
  const [editDueDate, setEditDueDate] = useState("");
  const [editVhrEstimate, setEditVhrEstimate] = useState<number | "">("");

  // Invoice email
  const [invoiceEmailOpen, setInvoiceEmailOpen] = useState(false);
  const [invoiceEmailSubject, setInvoiceEmailSubject] = useState("");
  const [invoiceEmailBody, setInvoiceEmailBody] = useState("");
  const [invoiceRecipientEmail, setInvoiceRecipientEmail] = useState("");
  const [invoiceRecipientName, setInvoiceRecipientName] = useState("");
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
  // Lot 2 - tracking dates & logistics for liaison sheet
  const [editEventRealDate, setEditEventRealDate] = useState("");
  const [editClientDepositPaidAt, setEditClientDepositPaidAt] = useState("");
  const [editSpeakerDepositPaidAt, setEditSpeakerDepositPaidAt] = useState("");
  const [editClientInvoiceSentAt, setEditClientInvoiceSentAt] = useState("");
  const [editClientInvoicePaidAt, setEditClientInvoicePaidAt] = useState("");
  const [editSpeakerSignedAt, setEditSpeakerSignedAt] = useState("");
  const [editSpeakerAcknowledgmentAt, setEditSpeakerAcknowledgmentAt] = useState("");
  const [editSpeakerPaidAt, setEditSpeakerPaidAt] = useState("");
  const [editLiaisonSheetSentAt, setEditLiaisonSheetSentAt] = useState("");
  const [editLogisticsInfo, setEditLogisticsInfo] = useState("");
  const [editClientSignedReceivedAt, setEditClientSignedReceivedAt] = useState("");

  useEffect(() => {
    fetchData();
    fetchClients();
  }, [proposal.id]);

  const fetchData = async () => {
    setLoading(true);
    const [contractRes, invoicesRes, eventRes] = await Promise.all([
      supabase
        .from("contracts")
        .select("*")
        .eq("proposal_id", proposal.id)
        .order("version", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("proposal_id", proposal.id).order("created_at"),
      supabase.from("events").select("*").eq("proposal_id", proposal.id).maybeSingle(),
    ]);
    const allContracts = ((contractRes.data as any) || []) as Contract[];
    const active = allContracts.find((c) => !c.superseded_at) || allContracts[0] || null;
    setContract(active);
    setPreviousContracts(allContracts.filter((c) => active && c.id !== active.id));
    setInvoices((invoicesRes.data as any) || []);
    setEvent(eventRes.data as any);
    setLoading(false);
  };


  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name, contact_name, email, phone, siret, address, city")
      .order("company_name");
    setClients((data as any) || []);
    const { data: sp } = await supabase
      .from("speakers")
      .select("id, name, base_fee, email, phone, city")
      .eq("archived", false)
      .order("name");
    setAllSpeakers((sp as any) || []);
  };

  // ─── Auto-create event if missing ───
  useEffect(() => {
    if (!loading && !event) {
      supabase
        .from("events")
        .insert({
          proposal_id: proposal.id,
          audience_size: proposal.audience_size || null,
        } as any)
        .then(() => fetchData());
    }
  }, [loading, event]);

  // Auto-select speaker if only one
  useEffect(() => {
    if (
      event &&
      !event.selected_speaker_id &&
      proposal.proposal_speakers.length === 1 &&
      proposal.proposal_speakers[0]?.speaker_id
    ) {
      const spId = proposal.proposal_speakers[0].speaker_id;
      supabase
        .from("events")
        .update({ selected_speaker_id: spId } as any)
        .eq("id", event.id)
        .then(async () => {
          if (contract)
            await supabase
              .from("contracts")
              .update({ selected_speaker_id: spId } as any)
              .eq("id", contract.id);
          fetchData();
        });
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
    return (
      proposal.proposal_speakers.find((ps) => ps.speaker_id === event.selected_speaker_id) ||
      proposal.proposal_speakers[0] ||
      null
    );
  };

  const getSelectedSpeakerInfo = () => getSelectedSpeaker()?.speakers || null;

  const handleSelectSpeaker = async (speakerId: string) => {
    if (!event) return;
    await supabase
      .from("events")
      .update({ selected_speaker_id: speakerId } as any)
      .eq("id", event.id);
    if (contract)
      await supabase
        .from("contracts")
        .update({ selected_speaker_id: speakerId } as any)
        .eq("id", contract.id);
    toast.success("Conférencier sélectionné");
    fetchData();
  };

  // ─── Compute totals ───
  // The agency commission is added to the global HT (silent — not shown as a separate line in the contract)
  const computeTotals = (lines: ContractLine[], discount: number, commission: number = 0) => {
    const linesSubtotal = lines.reduce((sum, l) => sum + l.amount_ht, 0);
    const subtotalHT = linesSubtotal + (commission || 0);
    const discountAmount = subtotalHT * (discount / 100);
    const totalHTAfterDiscount = subtotalHT - discountAmount;
    // TVA computed on the merged base, prorated against original line TVA mix (commission inherits 20%)
    const commissionTVA = (commission || 0) * 0.2;
    const linesTVA = lines.reduce((sum, l) => {
      const lineShare = linesSubtotal > 0 ? l.amount_ht / linesSubtotal : 0;
      const lineHTAfterDiscount = l.amount_ht - discountAmount * (linesSubtotal / (subtotalHT || 1)) * lineShare;
      return sum + lineHTAfterDiscount * (l.tva_rate / 100);
    }, 0);
    const totalTVA = linesTVA + commissionTVA * (1 - discount / 100);
    const totalTTC = totalHTAfterDiscount + totalTVA;
    return { subtotalHT, discountAmount, totalHTAfterDiscount, totalTVA, totalTTC };
  };

  const getEffectiveLines = (): ContractLine[] => {
    if (contract?.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0) {
      return contract.contract_lines as ContractLine[];
    }
    // For multiple proposals with a selected speaker, only show the selected one
    const speakersForContract = event?.selected_speaker_id
      ? proposal.proposal_speakers.filter((ps) => ps.speaker_id === event.selected_speaker_id)
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
  const effectiveCommission = (contract as any)?.agency_commission || 0;
  const effectiveLines = getEffectiveLines();
  const { totalHTAfterDiscount, totalTTC } = computeTotals(effectiveLines, effectiveDiscount, effectiveCommission);

  const selectedSpeaker = getSelectedSpeaker();
  const speakerInfo = getSelectedSpeakerInfo();
  const speakerSummary =
    speakerInfo?.name ||
    effectiveLines
      .filter((l) => l.type === "speaker")
      .map((l) => l.label)
      .join(", ") ||
    proposal.proposal_speakers.map((s) => s.speakers?.name || "—").join(", ");

  const buildInitialLines = (): ContractLine[] => {
    if (contract?.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0) {
      return contract.contract_lines as ContractLine[];
    }
    // For multiple proposals with a selected speaker, only show the selected one
    const speakersForContract = event?.selected_speaker_id
      ? proposal.proposal_speakers.filter((ps) => ps.speaker_id === event.selected_speaker_id)
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
    setContractLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };
  const removeLine = (id: string) => setContractLines((prev) => prev.filter((l) => l.id !== id));
  const updateAgencyCommission = (value: string) => {
    setAgencyCommissionText(value);
    setAgencyCommission(parseAmountInput(value));
  };
  const resetAgencyCommission = () => {
    setAgencyCommission(0);
    setAgencyCommissionText("0");
  };
  const addLine = (type: ContractLine["type"]) => {
    if (type === "speaker") {
      setSpeakerPickerSearch("");
      setSpeakerPickerOpen(true);
      return;
    }
    const defaults: Record<string, string> = {
      speaker: "Conférencier",
      travel: "Frais de déplacement",
      custom: "Prestation complémentaire",
    };
    setContractLines((prev) => [
      ...prev,
      { id: generateId(), label: defaults[type], amount_ht: 0, tva_rate: 20, type },
    ]);
  };
  const addSpeakerLineFromCRM = (sp: SpeakerCRM) => {
    setContractLines((prev) => [
      ...prev,
      {
        id: generateId(),
        label: sp.name,
        amount_ht: sp.base_fee || 0,
        tva_rate: 20,
        type: "speaker",
      },
    ]);
    setSpeakerPickerOpen(false);
    toast.success(`${sp.name} ajouté`);
  };

  // ─── Contract CRUD ───
  const parseProposalEventDate = (): string => {
    const txt = proposal.event_date_text || "";
    if (!txt) return "";
    const isoMatch = txt.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return isoMatch[0];
    const frMatch = txt.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
    if (frMatch) {
      const day = frMatch[1].padStart(2, "0");
      const month = frMatch[2].padStart(2, "0");
      let year = frMatch[3];
      if (year.length === 2) year = "20" + year;
      return `${year}-${month}-${day}`;
    }
    // French textual: "12 avril 2027", "1er septembre 2026"
    const months: Record<string, string> = {
      janvier: "01",
      février: "02",
      fevrier: "02",
      mars: "03",
      avril: "04",
      mai: "05",
      juin: "06",
      juillet: "07",
      août: "08",
      aout: "08",
      septembre: "09",
      octobre: "10",
      novembre: "11",
      décembre: "12",
      decembre: "12",
    };
    const txtLower = txt.toLowerCase().normalize("NFC");
    const frTextMatch = txtLower.match(/(\d{1,2})(?:er)?\s+([a-zà-ÿ]+)\s+(\d{4})/);
    if (frTextMatch) {
      const day = frTextMatch[1].padStart(2, "0");
      const month = months[frTextMatch[2]];
      const year = frTextMatch[3];
      if (month) return `${year}-${month}-${day}`;
    }
    return "";
  };

  const generateNextBdcNumber = async (): Promise<string> => {
    const { data } = await supabase.from("events").select("bdc_number").not("bdc_number", "is", null);
    let max = 0;
    (data || []).forEach((row: any) => {
      const m = /^BDC-(\d+)$/i.exec((row.bdc_number || "").trim());
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    });
    return `BDC-${String(max + 1).padStart(3, "0")}`;
  };

  const openCreateContract = async () => {
    setEditingContract(false);
    // Auto-fill from proposal data
    setEventDate(event?.event_date || parseProposalEventDate());
    setEventLocation(proposal.event_location || "");
    setEventTime("");
    setEventFormat("Conférence");
    setEventDescription("");
    setContractAudienceSize(proposal.audience_size || "");
    setContractTheme(event?.theme || "");
    const nextBdc = await generateNextBdcNumber();
    setContractBdcNumber(event?.bdc_number || nextBdc);
    // Pre-fill agency commission from proposal (selected speaker if any, else sum across speakers)
    const speakersForCommission = event?.selected_speaker_id
      ? proposal.proposal_speakers.filter((ps) => ps.speaker_id === event.selected_speaker_id)
      : proposal.proposal_speakers;
    const proposalCommission = speakersForCommission.reduce((sum, ps) => sum + (Number(ps.agency_commission) || 0), 0);
    setContractLines(buildInitialLines());
    setDiscountPercent(0);
    setAgencyCommission(proposalCommission);
    setAgencyCommissionText(proposalCommission ? String(proposalCommission) : "0");
    // Pre-select client if proposal already has one
    setContractClientId(proposal.client_id || "");
    setShowCreateClientInContract(false);
    setNewContractClientCompany("");
    setNewContractClientContact("");
    setNewContractClientEmail("");
    setNewContractClientPhone("");
    setNewContractClientSiret("");
    setNewContractClientAddress("");
    setNewContractClientCity("");
    setDepositRequired(true);
    setCustomClauses("");
    setArticleOverrides({});
    setContractDialogOpen(true);
  };

  const openEditContract = () => {
    if (!contract) return;
    setEditingContract(true);
    setEventDate(contract.event_date || event?.event_date || parseProposalEventDate());
    setEventLocation(contract.event_location || "");
    setEventTime(contract.event_time || "");
    setEventFormat(contract.event_format || "Conférence");
    setEventDescription(contract.event_description || "");
    setContractAudienceSize(event?.audience_size || proposal.audience_size || "");
    setContractTheme(event?.theme || "");
    setContractBdcNumber(event?.bdc_number || "");
    setContractLines(buildInitialLines());
    setDiscountPercent(contract.discount_percent || 0);
    const savedCommission = Number((contract as any).agency_commission) || 0;
    setAgencyCommission(savedCommission);
    setAgencyCommissionText(savedCommission ? String(savedCommission) : "0");
    setContractClientId(proposal.client_id || "");
    setShowCreateClientInContract(false);
    setDepositRequired((contract as any).deposit_required !== false);
    const cc = (contract as any).custom_clauses;
    setCustomClauses(typeof cc === "string" ? cc : cc?.text || "");
    setArticleOverrides(cc && typeof cc === "object" && cc.articles ? { ...cc.articles } : {});
    setContractDialogOpen(true);
  };

  const handleCreateContractClient = async () => {
    if (!newContractClientCompany) {
      toast.error("Nom de société requis");
      return;
    }
    if (!newContractClientEmail) {
      toast.error("Email requis pour le contrat");
      return;
    }
    setCreatingClient(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_name: newContractClientCompany,
        contact_name: newContractClientContact || null,
        email: newContractClientEmail || null,
        phone: newContractClientPhone || null,
        siret: newContractClientSiret || null,
        address: newContractClientAddress || null,
        city: newContractClientCity || null,
      } as any)
      .select()
      .single();
    if (error || !data) {
      toast.error("Erreur création client");
      setCreatingClient(false);
      return;
    }
    toast.success("Client créé !");
    await fetchClients();
    setContractClientId((data as any).id);
    setShowCreateClientInContract(false);
    setNewContractClientCompany("");
    setNewContractClientContact("");
    setNewContractClientEmail("");
    setNewContractClientPhone("");
    setNewContractClientSiret("");
    setNewContractClientAddress("");
    setNewContractClientCity("");
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
      agency_commission: agencyCommission || 0,
      deposit_required: depositRequired,
      custom_clauses: (() => {
        const cleanedOverrides: Record<string, string> = {};
        Object.entries(articleOverrides).forEach(([k, v]) => {
          if (v && v.trim()) cleanedOverrides[k] = v;
        });
        const obj: any = {};
        if (customClauses) obj.text = customClauses;
        if (Object.keys(cleanedOverrides).length) obj.articles = cleanedOverrides;
        return obj;
      })(),
    };
    // Link client to proposal
    await supabase
      .from("proposals")
      .update({ client_id: contractClientId } as any)
      .eq("id", proposal.id);
    // Also update event with audience_size and bdc_number
    if (event) {
      // Pre-check BDC uniqueness if changed
      if (contractBdcNumber && contractBdcNumber !== event.bdc_number) {
        const { data: dup } = await supabase
          .from("events")
          .select("id")
          .eq("bdc_number", contractBdcNumber)
          .neq("id", event.id)
          .maybeSingle();
        if (dup) {
          toast.error(`Le numéro de BDC "${contractBdcNumber}" existe déjà`);
          setSaving(false);
          return;
        }
      }
      const { error: evErr } = await supabase
        .from("events")
        .update({
          audience_size: contractAudienceSize || null,
          theme: contractTheme || null,
          bdc_number: contractBdcNumber || null,
        } as any)
        .eq("id", event.id);
      if (evErr) {
        const msg =
          (evErr as any).code === "23505" || /duplicate/i.test(evErr.message)
            ? `Le numéro de BDC "${contractBdcNumber}" existe déjà`
            : "Erreur mise à jour du dossier";
        toast.error(msg);
        setSaving(false);
        return;
      }
    }
    const payloadWithSpeaker = { ...payload, selected_speaker_id: event?.selected_speaker_id || null };
    if (editingContract && contract) {
      const { error } = await supabase
        .from("contracts")
        .update(payloadWithSpeaker as any)
        .eq("id", contract.id);
      if (error) toast.error("Erreur mise à jour");
      else toast.success("Contrat mis à jour !");
    } else {
      const { error } = await supabase
        .from("contracts")
        .insert({ proposal_id: proposal.id, ...payloadWithSpeaker } as any);
      if (error) {
        toast.error("Erreur création contrat");
        console.error(error);
      } else toast.success("Contrat créé !");
    }

    setContractDialogOpen(false);
    fetchData();
    onUpdate();
    setSaving(false);
  };

  // ─── Contract email ───
  const openContractEmail = () => {
    if (!contract) return;
    const dateStr = contract.event_date
      ? new Date(contract.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "à définir";
    const totals = computeTotals(
      getEffectiveLines(),
      contract.discount_percent || 0,
      (contract as any).agency_commission || 0,
    );

    // Pre-fill recipient from proposal
    setContractRecipientName(proposal.recipient_name || "");
    setContractRecipientEmail(proposal.client_email);
    setSelectedClientId("");
    setShowCreateClient(false);

    setContractEmailSubject(`Bon de commande - ${proposal.client_name} - Les Conférenciers`);
    setContractEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Suite à nos précédents échanges, je suis ravie de vous adresser le bon de commande relatif à l’intervention de ${speakerSummary}

📋 Voici un petit récapitulatif : :
• Conférencier(s) : ${speakerSummary}
• Date : ${dateStr}
• Lieu : ${contract.event_location || "à définir"}
• Montant total TTC : ${totals.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €

👉 Vous pouvez consulter le contrat et le signer électroniquement en cliquant sur le bouton ci-dessous.

N’hésitez pas à me contacter si vous avez la moindre question, je reste à votre entière disposition.
Dans l’attente de votre retour, je vous souhaite une très belle journée.

Bien cordialement,
Nelly Sabde - Les Conférenciers`);
    setContractEmailOpen(true);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setContractRecipientName(client.contact_name || "");
      setContractRecipientEmail(client.email || "");
      // Update email body greeting
      const firstName = client.contact_name?.split(" ")[0] || "";
      setContractEmailBody((prev) => {
        const lines = prev.split("\n");
        if (lines[0]?.startsWith("Bonjour")) {
          lines[0] = `Bonjour${firstName ? ` ${firstName}` : ""},`;
        }
        return lines.join("\n");
      });
    }
  };

  const handleCreateNewClient = async () => {
    if (!newClientCompany) {
      toast.error("Nom de société requis");
      return;
    }
    setCreatingClient(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_name: newClientCompany,
        contact_name: newClientContact || null,
        email: newClientEmail || null,
        phone: newClientPhone || null,
      } as any)
      .select()
      .single();
    if (error || !data) {
      toast.error("Erreur création client");
      setCreatingClient(false);
      return;
    }
    toast.success("Client créé !");
    await fetchClients();
    // Auto-select new client
    setSelectedClientId((data as any).id);
    setContractRecipientName(newClientContact || "");
    setContractRecipientEmail(newClientEmail || "");
    setShowCreateClient(false);
    setNewClientCompany("");
    setNewClientContact("");
    setNewClientEmail("");
    setNewClientPhone("");
    setCreatingClient(false);
  };

  const handleSendContractEmail = async () => {
    if (!contract) return;
    // Auto-use proposal recipient — no manual selector needed
    const targetEmail = proposal.client_email;
    if (!targetEmail) {
      toast.error("Aucun email client sur la proposition");
      return;
    }
    setSendingContract(true);
    try {
      const { error } = await supabase.functions.invoke("send-contract-email", {
        body: {
          contract_id: contract.id,
          email_subject: contractEmailSubject,
          email_body: contractEmailBody,
          recipient_email: targetEmail,
        },
      });
      if (error) throw error;
      await supabase
        .from("contracts")
        .update({ status: "sent", contract_sent_at: new Date().toISOString() } as any)
        .eq("id", contract.id);
      // Ne pas toucher à contract_sent_speaker_at (= communication conférencier).
      toast.success("Contrat envoyé par email !");
      setContractEmailOpen(false);
      fetchData();
      onUpdate();
    } catch {
      toast.error("Erreur d'envoi du contrat");
    }
    setSendingContract(false);
  };

  // ─── Speaker email ───
  const buildSpeakerEmailSubject = (type: "info" | "contract") => {
    const eventDateLong = liaisonEventDateFmt(contract?.event_date || (event as any)?.event_date || "");
    const datePart = eventDateLong ? `Conférence du ${eventDateLong}` : "Conférence";
    return type === "info"
      ? `${datePart} - ${proposal.client_name}`
      : `Bon de commande - ${datePart} - ${proposal.client_name}`;
  };

  const buildSpeakerEmailBody = (type: "info" | "contract", addressing: "formal" | "informal") => {
    const speaker = getSelectedSpeakerInfo();
    const speakerName = speaker?.name || "le conférencier";
    const firstName = speakerName.split(" ")[0];
    const vouvoi = addressing === "formal";
    const greeting = `Bonjour ${firstName},`;
    const dateStr = contract?.event_date
      ? new Date(contract.event_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "à définir";
    const ps = getSelectedSpeaker();
    const budget = event?.speaker_budget || ps?.speaker_fee || 0;

    const ack = vouvoi
      ? "Pourriez-vous m'accuser réception de ce mail ?"
      : "Peux-tu m'accuser réception de ce mail ?";
    const closing = vouvoi ? "À très bientôt et bonne journée !" : "À très vite et bonne journée !";

    const line = (label: string, value: string | undefined | null) =>
      value ? `<p>${label} <strong>${value}</strong></p>` : "";

    if (type === "info") {
      const intro = vouvoi
        ? "Voici comme convenu les informations concernant votre intervention :"
        : "Voici comme convenu les infos concernant ton intervention :";
      return `<p>${greeting}</p>
<p>${intro}</p>
${line("📅 Date de l'évènement :", dateStr)}
${line("📍 Lieu de l'intervention :", contract?.event_location || "à définir")}
${line("🕐 Horaires de l'intervention :", contract?.event_time || "à définir")}
${line("🎤 Conférence :", event?.conference_title)}
${line("⏱ Durée :", event?.conference_duration)}
${line("👥 Auditoire :", event?.audience_size || "à définir")}
${line("📋 Thématique :", event?.theme || "à définir")}
${line("🏢 Client :", proposal.client_name)}
${line("💰 Budget :", budget ? budget.toLocaleString("fr-FR") + " euros HT, hors frais VHR" : "à définir")}
${line("👔 Dress code :", event?.dress_code)}
${event?.contact_on_site_name ? `<p>👤 Contact sur place : <strong>${event.contact_on_site_name}${event?.contact_on_site_phone ? ` - ${event.contact_on_site_phone}` : ""}${event?.contact_on_site_email ? ` - ${event.contact_on_site_email}` : ""}</strong></p>` : ""}
${line("🚗 Arrivée :", event?.arrival_info)}
${line("🅿️ Parking :", event?.parking_info)}
${line("🏨 Hôtel :", event?.hotel_info)}
${line("🔧 Technique :", event?.tech_needs)}
${line("🪑 Configuration salle :", event?.room_setup)}
${event?.special_requests ? `<p>📝 Remarques : ${event.special_requests}</p>` : ""}
<p><strong>${ack}</strong></p>
<p>${closing}</p>
<p>Nelly Sabde - Les Conférenciers</p>`;
    }
    const intro = vouvoi
      ? "Veuillez trouver ci-joint le bon de commande pour votre intervention :"
      : "Voici le bon de commande pour ton intervention :";
    const sendBack = vouvoi
      ? "Merci de me retourner le contrat signé dès que possible."
      : "Merci de me retourner le contrat signé dès que possible.";
    const sign = vouvoi ? "Restant à votre disposition." : "À très vite !";
    return `<p>${greeting}</p>
<p>${intro}</p>
${line("📅 Date de l'évènement :", dateStr)}
${line("📍 Lieu :", contract?.event_location || "à définir")}
${line("🏢 Client :", proposal.client_name)}
${line("💰 Budget :", budget ? budget.toLocaleString("fr-FR") + " euros HT, hors frais VHR" : "à définir")}
<p><strong>${ack}</strong> ${sendBack}</p>
<p>${sign}</p>
<p>Nelly Sabde - Les Conférenciers</p>`;
  };

  const openSpeakerEmail = (type: "info" | "contract") => {
    setSpeakerEmailType(type);
    const speaker = getSelectedSpeakerInfo();
    const initialAddressing: "formal" | "informal" = speaker?.formal_address === false ? "informal" : "formal";
    setSpeakerEmailAddressing(initialAddressing);
    setSpeakerEmailTo(speaker?.email || "");
    setSpeakerEmailCc("");
    setSpeakerEmailSubject(buildSpeakerEmailSubject(type));
    setSpeakerEmailBody(buildSpeakerEmailBody(type, initialAddressing));
    setSpeakerEmailOpen(true);
  };

  const handleSendSpeakerEmail = async () => {
    setSendingSpeakerEmail(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toList = speakerEmailTo
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ccList = speakerEmailCc
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (toList.length === 0) {
      toast.error("Veuillez renseigner au moins un destinataire");
      setSendingSpeakerEmail(false);
      return;
    }
    const invalid = [...toList, ...ccList].find((e) => !emailRegex.test(e));
    if (invalid) {
      toast.error(`Email invalide : ${invalid}`);
      setSendingSpeakerEmail(false);
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          to: toList,
          cc: ccList.length > 0 ? ccList : undefined,
          subject: speakerEmailSubject,
          body: speakerEmailBody,
          from_name: "Les Conférenciers",
        },
      });
      if (error) throw error;

      // Track in event
      const field = speakerEmailType === "info" ? "info_sent_speaker_at" : "contract_sent_speaker_at";
      if (event) {
        await supabase
          .from("events")
          .update({ [field]: new Date().toISOString() } as any)
          .eq("id", event.id);
      }
      toast.success("Email envoyé au conférencier !");
      setSpeakerEmailOpen(false);
      fetchData();
    } catch {
      toast.error("Erreur d'envoi");
    }
    setSendingSpeakerEmail(false);
  };

  // ─── Liaison Sheet ───
  // URL publique vers la feuille de liaison (token de l'event)
  const liaisonPublicUrl = () => {
    const token = (event as any)?.token;
    return token ? `${window.location.origin}/feuille-liaison/${token}` : "";
  };

  const liaisonButtonHtml = () => {
    const url = liaisonPublicUrl();
    if (!url) return "";
    return `<p style="text-align:center;margin:24px 0;"><a href="${url}" style="display:inline-block;background:#1a2332;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Consulter la feuille de liaison</a></p>`;
  };

  // Helper: build speaker body based on tu/vous choice
  const buildLiaisonSpeakerBody = (addressing: "formal" | "informal", speakerFirstName: string) => {
    if (addressing === "informal") {
      return `<p>Bonjour ${speakerFirstName},</p>
<p>Voici comme convenu la feuille de liaison pour ton intervention.</p>
${liaisonButtonHtml()}
<p><strong>Peux-tu m'accuser réception de ce mail ?</strong></p>
<p>Je te souhaite une excellente journée !</p>
<p>Nelly Sabde - Les Conférenciers</p>`;
    }
    return `<p>Bonjour ${speakerFirstName},</p>
<p>Voici comme convenu la feuille de liaison pour votre intervention.</p>
${liaisonButtonHtml()}
<p><strong>Pourriez-vous m'accuser réception de ce mail ?</strong></p>
<p>Je vous souhaite une excellente journée !</p>
<p>Nelly Sabde - Les Conférenciers</p>`;
  };

  const openLiaisonDialog = () => {
    const speaker = getSelectedSpeakerInfo();
    const speakerName = speaker?.name || "";
    const speakerFirstName = speakerName.split(" ")[0];
    const initialAddressing: "formal" | "informal" = speaker?.formal_address === false ? "informal" : "formal";
    setLiaisonAddressing(initialAddressing);
    const clientFirstName = proposal.recipient_name?.split(" ")[0] || "";

    setLiaisonNotes(
      event?.notes ||
        event?.visio_notes ||
        (contract as any)?.event_description ||
        "L'intervenant participera avec plaisir au déjeuner à l'issue de sa conférence.",
    );
    setLiaisonTechNeeds(event?.tech_needs || "Vidéoprojecteur\nMicro casque");
    setLiaisonSalleSetup("");
    setLiaisonArrival(event?.arrival_info || "");
    setLiaisonEventDate(contract?.event_date || (event as any)?.event_date || "");
    setLiaisonEventLocation(contract?.event_location || "");
    setLiaisonEventTime(contract?.event_time || "");
    setLiaisonAudience(event?.audience_size || "");
    setLiaisonTheme(event?.theme || "");
    setLiaisonTab("client");

    // Date FR longue pour les objets de mail
    const eventDateLong = liaisonEventDateFmt(contract?.event_date || (event as any)?.event_date || "");

    // Client email template (nouveau wording, sans prix)
    setLiaisonClientSubject(`Conférence du ${eventDateLong || "(date à confirmer)"} - ${proposal.client_name}`);
    setLiaisonClientBody(`<p>${clientFirstName ? clientFirstName : "Bonjour"},</p>
<p>Un grand merci pour nos échanges${event?.visio_date ? " de ce matin" : ""} !</p>
<p>Vous trouverez ci-joint comme convenu la feuille de liaison pour l'intervention de ${speakerName}, laissant apparaître ses coordonnées téléphoniques.</p>
${liaisonButtonHtml()}
<p>Vous en souhaitant bonne réception et restant à votre disposition si besoin est.</p>
<p>Excellente fin de journée à vous !</p>
<p>Nelly Sabde - Les Conférenciers</p>`);

    // Speaker email template — adressage piloté par le sélecteur dans la pop-up
    setLiaisonSpeakerSubject(`Conférence du ${eventDateLong || "(date à confirmer)"} - ${proposal.client_name}`);
    setLiaisonSpeakerBody(buildLiaisonSpeakerBody(initialAddressing, speakerFirstName));

    // Pre-fill recipients (editable) — pas de CC conférencier sur le mail client
    const speakerEmail = speaker?.email || "";
    setLiaisonClientTo(proposal.client_email || "");
    setLiaisonSpeakerTo(speakerEmail);
    setLiaisonClientCc("");
    setLiaisonSpeakerCc("");

    setLiaisonDialogOpen(true);
  };

  // Helper: format date longue FR (utilisée pour les objets de mail liaison)
  function liaisonEventDateFmt(d: string) {
    if (!d) return "";
    try {
      const dt = new Date(d.length === 10 ? d + "T12:00:00" : d);
      return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "";
    }
  }

  // Persist editable liaison fields back to contract + event
  const persistLiaisonFields = async () => {
    if (contract) {
      await supabase
        .from("contracts")
        .update({
          event_date: liaisonEventDate || null,
          event_location: liaisonEventLocation || null,
          event_time: liaisonEventTime || null,
        } as any)
        .eq("id", contract.id);
    }
    if (event) {
      await supabase
        .from("events")
        .update({
          audience_size: liaisonAudience || null,
          theme: liaisonTheme || null,
          arrival_info: liaisonArrival || null,
          tech_needs: liaisonTechNeeds || null,
          room_setup: liaisonSalleSetup || null,
          notes: liaisonNotes || null,
        } as any)
        .eq("id", event.id);
    }
  };

  const handlePreviewLiaisonSheet = async () => {
    // Ouvrir l'onglet immédiatement (dans le user gesture) pour éviter le blocage de popup
    const w = window.open("about:blank", "_blank");
    try {
      await persistLiaisonFields();
      await fetchData();
    } finally {
      const url = `/admin/feuille-liaison/${proposal.id}`;
      if (w) {
        w.location.href = url;
      } else {
        window.location.href = url;
      }
    }
  };

  const buildLiaisonContent = () => {
    const speaker = getSelectedSpeakerInfo();
    const speakerName = speaker?.name || "";
    const dateStr = liaisonEventDate
      ? new Date(liaisonEventDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "";
    return `

📋 FEUILLE DE LIAISON
${event?.event_title ? `\nÉvénement : ${event.event_title}` : ""}
📅 Date de l'évènement : ${dateStr}
📍 Lieu de l'intervention : ${liaisonEventLocation || ""}
🕐 Horaires de l'intervention : ${liaisonEventTime || ""}
${event?.conference_title ? `🎤 Conférence : ${event.conference_title}` : ""}
${event?.conference_duration ? `⏱ Durée : ${event.conference_duration}` : ""}
👥 Auditoire : ${liaisonAudience || ""}
🎯 Thématique : ${liaisonTheme || ""}
${event?.dress_code ? `👔 Dress code : ${event.dress_code}` : ""}
🚗 Arrivée du conférencier sur place : ${liaisonArrival || "à confirmer"}
${event?.parking_info ? `🅿️ Parking : ${event.parking_info}` : ""}
${event?.hotel_info ? `🏨 Hôtel : ${event.hotel_info}` : ""}

🔧 Besoins techniques :
${liaisonTechNeeds ? `- ${liaisonTechNeeds}` : ""}
${liaisonSalleSetup ? `- ${liaisonSalleSetup}` : ""}

👤 Contact client : ${event?.contact_on_site_name || proposal.recipient_name || proposal.client_name}${event?.contact_on_site_phone ? ` - ${event.contact_on_site_phone}` : ""}
🎤 Contact conférencier : ${speakerName}${speaker?.phone ? ` - ${speaker.phone}` : ""}
${event?.special_requests ? `\n📝 Remarques :\n${event.special_requests}` : ""}
${(event as any)?.logistics_info ? `\n🧳 Infos logistiques :\n${(event as any).logistics_info}` : ""}
${liaisonNotes ? `\n💬 Commentaires :\n${liaisonNotes}` : ""}`;
  };

  const handleSendLiaisonEmail = async (target: "client" | "speaker") => {
    setSendingLiaison(true);
    await persistLiaisonFields();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const splitList = (s: string) =>
      s
        .split(/[,;]/)
        .map((e) => e.trim())
        .filter(Boolean);
    const toList = splitList(target === "client" ? liaisonClientTo : liaisonSpeakerTo);
    const ccList = splitList(target === "client" ? liaisonClientCc : liaisonSpeakerCc);
    const subject = target === "client" ? liaisonClientSubject : liaisonSpeakerSubject;
    const body = target === "client" ? liaisonClientBody : liaisonSpeakerBody;

    const invalid = [...toList, ...ccList].find((e) => !emailRegex.test(e));
    if (invalid) {
      toast.error(`Email invalide : ${invalid}`);
      setSendingLiaison(false);
      return;
    }
    if (toList.length === 0) {
      toast.error(`Veuillez renseigner au moins un destinataire ${target === "client" ? "client" : "conférencier"}`);
      setSendingLiaison(false);
      return;
    }

    try {
      await supabase.functions.invoke("send-contact-email", {
        body: {
          to: toList,
          subject,
          body: body + buildLiaisonContent(),
          from_name: "Les Conférenciers",
          cc: ccList.length > 0 ? ccList : undefined,
        },
      });

      if (event) {
        const nowIso = new Date().toISOString();
        const patch: any =
          target === "client" ? { liaison_email_client_sent_at: nowIso } : { liaison_email_speaker_sent_at: nowIso };
        if (!event.liaison_sheet_sent_at) patch.liaison_sheet_sent_at = nowIso;
        await supabase.from("events").update(patch).eq("id", event.id);
      }
      toast.success(`Email ${target === "client" ? "client" : "conférencier"} envoyé !`);
      await fetchData();
    } catch {
      toast.error("Erreur d'envoi");
    }
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
    // tracking dates
    setEditEventRealDate((event as any)?.event_date || contract?.event_date || "");
    setEditClientDepositPaidAt((event as any)?.client_deposit_paid_at || "");
    setEditSpeakerDepositPaidAt((event as any)?.speaker_deposit_paid_at || "");
    setEditClientInvoiceSentAt((event as any)?.client_invoice_sent_at || "");
    setEditClientInvoicePaidAt((event as any)?.client_invoice_paid_at || "");
    setEditSpeakerSignedAt((event as any)?.speaker_signed_contract_at || "");
    setEditSpeakerAcknowledgmentAt((event as any)?.speaker_acknowledgment_at || "");
    setEditSpeakerPaidAt(event?.speaker_paid_at ? (event.speaker_paid_at as string).slice(0, 10) : "");
    setEditLiaisonSheetSentAt(event?.liaison_sheet_sent_at ? (event.liaison_sheet_sent_at as string).slice(0, 10) : "");
    setEditLogisticsInfo((event as any)?.logistics_info || "");
    setEditClientSignedReceivedAt((contract as any)?.client_signed_received_at || "");
    setEventEditOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!event) return;
    // Pre-check BDC uniqueness if changed
    if (editBdcNumber && editBdcNumber !== event.bdc_number) {
      const { data: dup } = await supabase
        .from("events")
        .select("id")
        .eq("bdc_number", editBdcNumber)
        .neq("id", event.id)
        .maybeSingle();
      if (dup) {
        toast.error(`Le numéro de BDC "${editBdcNumber}" existe déjà`);
        return;
      }
    }
    const { error } = await supabase
      .from("events")
      .update({
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
        event_date: editEventRealDate || null,
        client_deposit_paid_at: editClientDepositPaidAt || null,
        speaker_deposit_paid_at: editSpeakerDepositPaidAt || null,
        client_invoice_sent_at: editClientInvoiceSentAt || null,
        client_invoice_paid_at: editClientInvoicePaidAt || null,
        speaker_signed_contract_at: editSpeakerSignedAt || null,
        speaker_acknowledgment_at: editSpeakerAcknowledgmentAt || null,
        speaker_paid_at: editSpeakerPaidAt ? new Date(editSpeakerPaidAt + "T12:00:00").toISOString() : null,
        liaison_sheet_sent_at: editLiaisonSheetSentAt
          ? new Date(editLiaisonSheetSentAt + "T12:00:00").toISOString()
          : null,
        logistics_info: editLogisticsInfo || null,
      } as any)
      .eq("id", event.id);
    // Also update contract.client_signed_received_at if a contract exists
    if (contract?.id) {
      await supabase
        .from("contracts")
        .update({
          client_signed_received_at: editClientSignedReceivedAt || null,
        } as any)
        .eq("id", contract.id);
    }
    if (error) {
      const msg =
        (error as any).code === "23505" || /duplicate/i.test(error.message)
          ? `Le numéro de BDC "${editBdcNumber}" existe déjà`
          : "Erreur";
      toast.error(msg);
      return;
    }
    toast.success("Dossier mis à jour");
    setEventEditOpen(false);
    fetchData();
  };

  // ─── Visio quick save ───
  const handleSaveVisioQuick = async () => {
    if (!event) return;
    const dateStr = visioQuickDate ? visioQuickDate.toISOString().split("T")[0] : null;
    await supabase
      .from("events")
      .update({
        visio_date: dateStr,
        visio_time: visioQuickTime || null,
      } as any)
      .eq("id", event.id);
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
      notes: invoiceNotes.trim() || null,
    });
    if (error) {
      toast.error("Erreur");
      console.error(error);
    } else {
      toast.success("Facture créée !");
      setInvoiceDialogOpen(false);
      setDueDate("");
      setInvoiceNotes("");
      fetchData();
    }
    setCreatingInvoice(false);
  };

  const openEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditAmountHT(inv.amount_ht);
    setEditTvaRate(inv.tva_rate);
    setEditDueDate(inv.due_date || "");
    setEditVhrEstimate(inv.vhr_estimate ?? "");
    setEditInvoiceOpen(true);
  };

  const handleSaveInvoice = async () => {
    if (!editingInvoice) return;
    const amountTTC = editAmountHT * (1 + editTvaRate / 100);
    await supabase
      .from("invoices")
      .update({
        amount_ht: Math.round(editAmountHT * 100) / 100,
        tva_rate: editTvaRate,
        amount_ttc: Math.round(amountTTC * 100) / 100,
        due_date: editDueDate || null,
        vhr_estimate: editVhrEstimate === "" ? null : Number(editVhrEstimate),
      } as any)
      .eq("id", editingInvoice.id);
    toast.success("Facture mise à jour !");
    setEditInvoiceOpen(false);
    fetchData();
  };

  const openInvoiceEmail = (inv: Invoice) => {
    setEmailInvoice(inv);
    const firstName = proposal.recipient_name ? proposal.recipient_name.split(" ")[0] : "";
    const eventDateLong = contract?.event_date
      ? new Date(contract.event_date + "T12:00:00").toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";
    setInvoiceRecipientEmail(proposal.client_email || "");
    setInvoiceRecipientName(proposal.recipient_name || "");

    if (inv.invoice_type === "acompte") {
      setInvoiceEmailSubject(`Intervention de ${speakerSummary} du ${eventDateLong}`);
      setInvoiceEmailBody(`Bonjour${firstName ? ` ${firstName}` : ""},

Suite à nos précédents échanges, vous trouverez ci-dessous comme convenu la facture d'acompte pour l'intervention de ${speakerSummary}.

Cliquez sur le bouton ci-dessous pour consulter et télécharger votre facture.

Je reste bien évidemment à votre disposition si besoin est.

Dans l'attente de nos prochains échanges, je vous souhaite une excellente journée.

Nelly Sabde - Les Conférenciers`);
    } else if (inv.invoice_type === "solde") {
      setInvoiceEmailSubject(`Intervention de ${speakerSummary} du ${eventDateLong}`);
      setInvoiceEmailBody(`Bonjour${firstName ? ` ${firstName}` : ""},

Avant toute chose, je tenais à vous remercier pour la confiance que vous m'avez accordée et pour la qualité de nos échanges lors de cette collaboration !

Vous trouverez ci-dessous comme convenu la facture correspondant à l'intervention de ${speakerSummary}.

Comme évoqué, je vous communique également un lien pour laisser un avis sur l'agence.

Les retours des clients récents sont pour nous très précieux :
https://g.page/r/CZqRK1WOkub-EAI/review

Cliquez sur le bouton ci-dessous pour consulter la facture.

Je reste bien évidemment à votre disposition.

Au plaisir de futurs échanges.

Très belle journée à vous,
Nelly Sabde - Les Conférenciers`);
    } else {
      setInvoiceEmailSubject(`Facture ${inv.invoice_number} - ${proposal.client_name}`);
      setInvoiceEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Veuillez trouver votre facture ci-dessous.

📄 Facture n° ${inv.invoice_number}
• Montant HT : ${inv.amount_ht.toLocaleString("fr-FR")} €
• TVA ${inv.tva_rate}% : ${(inv.amount_ttc - inv.amount_ht).toLocaleString("fr-FR")} €
• Montant TTC : ${inv.amount_ttc.toLocaleString("fr-FR")} €

👉 Cliquez sur le bouton ci-dessous pour consulter la facture.

Cordialement,
Nelly Sabde - Les Conférenciers`);
    }
    setInvoiceEmailOpen(true);
  };

  const handleSendInvoiceEmail = async () => {
    if (!emailInvoice) return;
    if (!invoiceRecipientEmail.trim()) {
      toast.error("Email destinataire requis");
      return;
    }
    setSendingInvoice(true);
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoice_id: emailInvoice.id,
          email_subject: invoiceEmailSubject,
          email_body: invoiceEmailBody,
          to: invoiceRecipientEmail,
          recipient_name: invoiceRecipientName,
        },
      });
      if (error) throw error;
      await supabase
        .from("invoices")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", emailInvoice.id);
      toast.success(`Facture ${emailInvoice.invoice_number} envoyée !`);
      setInvoiceEmailOpen(false);
      fetchData();
    } catch {
      toast.error("Erreur d'envoi");
    }
    setSendingInvoice(false);
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoice.id);
    toast.success(`Facture ${invoice.invoice_number} marquée payée`);
    fetchData();
    onUpdate();
  };

  const handleMarkUnpaid = async (invoice: Invoice) => {
    await supabase.from("invoices").update({ status: "sent", paid_at: null }).eq("id", invoice.id);
    toast.success(`Facture ${invoice.invoice_number} remise en attente`);
    fetchData();
    onUpdate();
  };

  const handleMarkSpeakerPaid = async () => {
    if (!event) return;
    await supabase
      .from("events")
      .update({ speaker_paid_at: new Date().toISOString() } as any)
      .eq("id", event.id);
    toast.success("Conférencier marqué comme payé");
    fetchData();
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const getContractSignUrl = () =>
    contract?.token ? `${window.location.origin}/signer-contrat/${contract.token}` : null;

  const dialogTotals = computeTotals(contractLines, discountPercent, agencyCommission);

  if (loading) return <div className="text-muted-foreground text-xs py-2">Chargement…</div>;

  // Pipeline supprimé du détail (visible uniquement en vue liste compacte)

  return (
    <div className="space-y-6 mt-4 border-t border-border pt-4">
      {/* ─── Speaker Selector ─── */}
      {proposal.proposal_speakers.length > 1 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <Label className="text-xs font-semibold flex items-center gap-2 mb-2">
            <User className="h-4 w-4" /> Conférencier retenu pour la prestation
          </Label>
          <div className="flex flex-wrap gap-2">
            {proposal.proposal_speakers.map((ps) => {
              const isSelected = event?.selected_speaker_id === ps.speaker_id;
              return (
                <button
                  key={ps.speaker_id}
                  onClick={() => ps.speaker_id && handleSelectSpeaker(ps.speaker_id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm"
                      : "border-border bg-background hover:border-primary/50 text-foreground",
                  )}
                >
                  <span>{ps.speakers?.name || "—"}</span>
                  {ps.speakers?.email && (
                    <span
                      className={cn("text-[10px]", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}
                    >
                      ({ps.speakers.email})
                    </span>
                  )}
                  {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Contract Section ─── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Contrat client
          </h3>
          {/* Bandeau date/lieu/format retiré à la demande pour alléger l'aperçu contrat */}
        </div>
        {!contract ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openCreateContract}>
            <Plus className="h-3 w-3" /> Créer le contrat
          </Button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                contract.status === "signed"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {contract.status === "signed"
                ? `✓ Signé${contract.signer_name ? ` par ${contract.signer_name}` : ""}`
                : contract.status === "sent"
                  ? "⏳ Non signé (envoyé)"
                  : "⚠️ Non signé (brouillon)"}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={openEditContract}
              title="Éditer les informations du contrat"
            >
              <Pencil className="h-3 w-3" /> Modifier
            </Button>
            {contract.status === "draft" && (
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={openContractEmail}>
                <Send className="h-3 w-3" /> Envoyer
              </Button>
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

      {contract && (
        <div className="border border-border/60 rounded-lg p-3 bg-muted/10">
          <SignedContractUpload contractId={contract.id} />
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
            <a
              href={`/admin/contrat-conferencier/${proposal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1"
            >
              <Eye className="h-3 w-3" /> Voir BDC
            </a>
          </Button>
        </div>
      </div>

      {(event?.info_sent_speaker_at || event?.contract_sent_speaker_at) && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          {event?.info_sent_speaker_at && <span>📧 Infos envoyées le {formatDate(event.info_sent_speaker_at)}</span>}
          {event?.contract_sent_speaker_at && (
            <span>📄 Contrat envoyé le {formatDate(event.contract_sent_speaker_at)}</span>
          )}
        </div>
      )}

      {/* ─── Liaison Sheet ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Feuille de liaison
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={openLiaisonDialog}>
            <Pencil className="h-3 w-3" /> Modifier
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={openLiaisonDialog}>
            <Send className="h-3 w-3" /> {event?.liaison_sheet_sent_at ? "Renvoyer" : "Envoyer"}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a
              href={`/admin/feuille-liaison/${proposal.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1"
            >
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
        {(() => {
          const hasTotal = invoices.some((i) => i.invoice_type === "total");
          const hasAcompte = invoices.some((i) => i.invoice_type === "acompte");
          const hasSolde = invoices.some((i) => i.invoice_type === "solde");
          const canCreate = !hasTotal && !hasSolde;
          const onlySolde = hasAcompte && !hasSolde && !hasTotal;
          const disabledTitle = hasTotal
            ? "Une facture totale a déjà été créée"
            : hasSolde
            ? "Le solde a déjà été facturé"
            : "";
          return (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={!canCreate}
              title={disabledTitle || undefined}
              onClick={() => {
                if (onlySolde) setInvoiceType("solde");
                else setInvoiceType("total");
                setInvoiceDialogOpen(true);
              }}
            >
              <Plus className="h-3 w-3" /> Créer une facture
            </Button>
          );
        })()}
      </div>


      {invoices.length > 0 && (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className={`border rounded-lg p-4 ${
                inv.status === "paid"
                  ? "border-green-200 bg-green-50/50"
                  : inv.status === "sent"
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">{inv.invoice_number}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {inv.invoice_type === "acompte"
                      ? "Acompte 50%"
                      : inv.invoice_type === "solde"
                        ? "Solde 50%"
                        : "Total"}
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
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      Brouillon
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {inv.status === "draft" && (
                    <Button size="sm" variant="ghost" onClick={() => openEditInvoice(inv)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/admin/facture/${inv.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  {inv.status === "draft" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openInvoiceEmail(inv)}>
                      <Send className="h-3 w-3" /> Envoyer
                    </Button>
                  )}
                  {inv.status === "sent" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-dashed"
                      onClick={() => handleMarkPaid(inv)}
                      title="À cliquer uniquement lorsque le paiement est reçu"
                    >
                      <CheckCircle className="h-3 w-3" /> Marquer comme payée
                    </Button>
                  )}
                  {inv.status === "paid" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs text-muted-foreground"
                      onClick={() => handleMarkUnpaid(inv)}
                    >
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
          <Button
            size="sm"
            className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={handleMarkSpeakerPaid}
          >
            <CheckCircle className="h-3 w-3" /> Marquer payé
          </Button>
        )}
      </div>

      {/* ═══ DIALOGS ═══ */}

      {/* Contract form dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="w-[min(42rem,calc(100vw-2rem))] max-w-none max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-w-0 [&_*]:box-border [&_button]:max-w-full [&_input]:max-w-full [&_textarea]:max-w-full [&_select]:max-w-full">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingContract ? "Modifier" : "Créer"} le contrat - {proposal.client_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2 min-w-0 max-w-full">
            {/* Client selector - mandatory */}
            <div className="space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 min-w-0 max-w-full overflow-hidden">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Client (obligatoire pour le contrat) *
              </Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
                  value={contractClientId}
                  onChange={(e) => {
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
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                      {c.contact_name ? ` - ${c.contact_name}` : ""}
                      {c.email ? ` (${c.email})` : ""}
                    </option>
                  ))}
                  <option value="__new__">➕ Créer un nouveau client…</option>
                </select>
              </div>
              {!contractClientId && !showCreateClientInContract && (
                <p className="text-[10px] text-destructive">
                  ⚠ Un client doit être sélectionné pour éditer le bon de commande
                </p>
              )}

              {showCreateClientInContract && (
                <div className="border border-primary/30 rounded-lg p-3 space-y-3 bg-primary/5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Nouveau client
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Société *</Label>
                      <Input
                        value={newContractClientCompany}
                        onChange={(e) => setNewContractClientCompany(e.target.value)}
                        placeholder="SNCF"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Nom du contact</Label>
                      <Input
                        value={newContractClientContact}
                        onChange={(e) => setNewContractClientContact(e.target.value)}
                        placeholder="Pascal Dupont"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Email *</Label>
                      <Input
                        type="email"
                        value={newContractClientEmail}
                        onChange={(e) => setNewContractClientEmail(e.target.value)}
                        placeholder="email@societe.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Téléphone</Label>
                      <Input
                        value={newContractClientPhone}
                        onChange={(e) => setNewContractClientPhone(e.target.value)}
                        placeholder="06 XX XX XX XX"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">SIRET</Label>
                      <Input
                        value={newContractClientSiret}
                        onChange={(e) => setNewContractClientSiret(e.target.value)}
                        placeholder="123 456 789 00012"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Ville</Label>
                      <Input
                        value={newContractClientCity}
                        onChange={(e) => setNewContractClientCity(e.target.value)}
                        placeholder="Paris"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Adresse</Label>
                      <Input
                        value={newContractClientAddress}
                        onChange={(e) => setNewContractClientAddress(e.target.value)}
                        placeholder="12 rue de la Paix"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateContractClient} disabled={creatingClient} className="gap-1">
                      <UserPlus className="h-3 w-3" /> {creatingClient ? "Création…" : "Créer et sélectionner"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreateClientInContract(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {/* Show selected client info (editable) */}
              {contractClientId &&
                (() => {
                  const c = clients.find((cl) => cl.id === contractClientId);
                  if (!c) return null;
                  if (!editClientInContract) {
                    return (
                      <div className="text-[10px] text-muted-foreground space-y-0.5 bg-background p-2 rounded border border-border/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p>
                              <strong>{c.company_name}</strong>
                              {c.contact_name ? ` - ${c.contact_name}` : ""}
                            </p>
                            {c.email && <p>📧 {c.email}</p>}
                            {(c as any).phone && <p>📞 {(c as any).phone}</p>}
                            {c.siret && <p>🏢 SIRET : {c.siret}</p>}
                            {c.address && (
                              <p>
                                📍 {c.address}
                                {c.city ? `, ${c.city}` : ""}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setEditClientCompany(c.company_name || "");
                              setEditClientContact(c.contact_name || "");
                              setEditClientEmail(c.email || "");
                              setEditClientPhone((c as any).phone || "");
                              setEditClientSiret(c.siret || "");
                              setEditClientAddress(c.address || "");
                              setEditClientCity(c.city || "");
                              setEditClientInContract(true);
                            }}
                          >
                            ✏️ Modifier
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="border border-primary/30 rounded-lg p-3 space-y-3 bg-primary/5">
                      <Label className="text-xs font-semibold">✏️ Modifier les informations du client</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Société *</Label>
                          <Input
                            value={editClientCompany}
                            onChange={(e) => setEditClientCompany(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Nom du contact</Label>
                          <Input
                            value={editClientContact}
                            onChange={(e) => setEditClientContact(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Email</Label>
                          <Input
                            type="email"
                            value={editClientEmail}
                            onChange={(e) => setEditClientEmail(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Téléphone</Label>
                          <Input
                            value={editClientPhone}
                            onChange={(e) => setEditClientPhone(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">SIRET</Label>
                          <Input
                            value={editClientSiret}
                            onChange={(e) => setEditClientSiret(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Ville</Label>
                          <Input
                            value={editClientCity}
                            onChange={(e) => setEditClientCity(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Adresse</Label>
                          <Input
                            value={editClientAddress}
                            onChange={(e) => setEditClientAddress(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={savingClientEdit}
                          className="gap-1"
                          onClick={async () => {
                            if (!editClientCompany) {
                              toast.error("Société requise");
                              return;
                            }
                            setSavingClientEdit(true);
                            const { error } = await supabase
                              .from("clients")
                              .update({
                                company_name: editClientCompany,
                                contact_name: editClientContact || null,
                                email: editClientEmail || null,
                                phone: editClientPhone || null,
                                siret: editClientSiret || null,
                                address: editClientAddress || null,
                                city: editClientCity || null,
                              } as any)
                              .eq("id", c.id);
                            if (error) {
                              toast.error("Erreur de sauvegarde");
                            } else {
                              toast.success("Client mis à jour");
                              await fetchClients();
                              setEditClientInContract(false);
                            }
                            setSavingClientEdit(false);
                          }}
                        >
                          {savingClientEdit ? "Sauvegarde…" : "Enregistrer"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditClientInContract(false)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* Speaker selector — allows changing the assigned speaker even after contract creation */}
            {proposal.proposal_speakers.length > 1 && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                <Label className="text-xs font-semibold flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Conférencier retenu pour ce contrat
                </Label>
                <div className="flex flex-wrap gap-2">
                  {proposal.proposal_speakers.map((ps) => {
                    const isSelected = event?.selected_speaker_id === ps.speaker_id;
                    return (
                      <button
                        key={ps.speaker_id}
                        type="button"
                        onClick={async () => {
                          if (!ps.speaker_id || !event) return;
                          await supabase
                            .from("events")
                            .update({ selected_speaker_id: ps.speaker_id } as any)
                            .eq("id", event.id);
                          if (contract)
                            await supabase
                              .from("contracts")
                              .update({ selected_speaker_id: ps.speaker_id } as any)
                              .eq("id", contract.id);
                          // Rebuild lines for the newly selected speaker

                          const newLines = [
                            {
                              id: generateId(),
                              label: ps.speakers?.name || "Conférencier",
                              amount_ht: ps.total_price || 0,
                              tva_rate: 20,
                              type: "speaker" as const,
                            },
                          ];
                          setContractLines(newLines);
                          fetchData();
                          toast.success("Conférencier mis à jour");
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-md border text-xs transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-medium"
                            : "border-border bg-background hover:border-primary/50",
                        )}
                      >
                        {ps.speakers?.name || "—"}
                        {isSelected && <CheckCircle className="h-3 w-3 inline-block ml-1" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Modifier ici si le conférencier choisi diffère de la proposition initiale.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 min-w-0">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horaires</Label>
                <Input placeholder="14h00 - 15h30" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lieu</Label>
              <Input
                placeholder="Hôtel Marriott, Paris"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 min-w-0">
              <div className="space-y-1">
                <Label className="text-xs">Taille de l'auditoire</Label>
                <Input
                  placeholder="200"
                  value={contractAudienceSize}
                  onChange={(e) => setContractAudienceSize(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">N° Bon de commande</Label>
                <Input
                  placeholder="BDC-001"
                  value={contractBdcNumber}
                  onChange={(e) => setContractBdcNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Thématique</Label>
              <Input
                placeholder="Leadership, innovation, transformation..."
                value={contractTheme}
                onChange={(e) => setContractTheme(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <Input
                placeholder="Conférence, Table ronde..."
                value={eventFormat}
                onChange={(e) => setEventFormat(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Détails</Label>
              <Textarea
                placeholder="Infos complémentaires..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Lines */}
            <div className="space-y-3 min-w-0">
              <Label className="text-sm font-semibold">Lignes de facturation</Label>
              {contractLines.map((line) => (
                <div key={line.id} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2 min-w-0">
                  <div className="flex items-start gap-2 min-w-0 max-w-full overflow-hidden">
                    <span
                      className={cn(
                        "inline-flex shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground",
                        line.type === "speaker" && "bg-primary/10 text-primary",
                      )}
                    >
                      {line.type === "speaker" ? "Conférencier" : line.type === "travel" ? "Déplacement" : "Autre"}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="ml-auto h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeLine(line.id)}
                      title="Supprimer cette ligne"
                      aria-label="Supprimer cette ligne"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={line.label}
                    onChange={(e) => updateLine(line.id, "label", e.target.value)}
                    className="h-8 text-sm min-w-0 max-w-full"
                  />
                  <div className="grid grid-cols-1 gap-2 min-w-0">
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-[10px] text-muted-foreground">Montant HT (€)</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={line.amount_ht}
                        onChange={(e) => updateLine(line.id, "amount_ht", Number(e.target.value))}
                        className="h-8 text-sm min-w-0 max-w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-[10px] text-muted-foreground">TVA</Label>
                      <Select
                        value={String(line.tva_rate)}
                        onValueChange={(v) => updateLine(line.id, "tva_rate", Number(v))}
                      >
                        <SelectTrigger className="h-8 text-sm max-w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TVA_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 gap-2 min-w-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full justify-center gap-1 text-xs min-w-0"
                  onClick={() => addLine("speaker")}
                >
                  <Plus className="h-3 w-3 shrink-0" /> <span className="truncate">Conférencier</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full justify-center gap-1 text-xs min-w-0"
                  onClick={() => addLine("travel")}
                >
                  <Plus className="h-3 w-3 shrink-0" /> <span className="truncate">Déplacement</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full justify-center gap-1 text-xs min-w-0"
                  onClick={() => addLine("custom")}
                >
                  <Plus className="h-3 w-3 shrink-0" /> <span className="truncate">Autre</span>
                </Button>
              </div>
            </div>

            {/* Agency commission (silently merged into the total — never shown as a separate line in the contract) */}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50 min-w-0">
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-semibold flex items-center gap-2">
                  <CircleDollarSign className="h-3.5 w-3.5" /> Commission agence HT
                </Label>
                <p className="text-[10px] text-muted-foreground">Interne, incluse dans le prix global client.</p>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 min-w-0 max-w-full overflow-hidden">
                <div className="relative flex-1 min-w-0">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={agencyCommissionText}
                    onChange={(e) => updateAgencyCommission(e.target.value)}
                    className="h-8 pr-8 text-sm text-right min-w-0"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    €
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={resetAgencyCommission}
                >
                  Retirer
                </Button>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 min-w-0">
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs">Remise globale (%)</Label>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-20 h-8 text-sm text-right shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 text-sm min-w-0">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total lignes HT</span>
                <span>
                  {(dialogTotals.subtotalHT - (agencyCommission || 0)).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </span>
              </div>
              {agencyCommission > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>+ Commission agence (interne)</span>
                  <span>{agencyCommission.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total HT</span>
                <span>{dialogTotals.subtotalHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remise ({discountPercent}%)</span>
                  <span>-{dialogTotals.discountAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Total HT</span>
                <span>{dialogTotals.totalHTAfterDiscount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>TVA</span>
                <span>{dialogTotals.totalTVA.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>Total TTC</span>
                <span>{dialogTotals.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
            </div>

            {/* Acompte requis */}
            <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div>
                <Label className="text-xs">Acompte client requis (50%)</Label>
                <p className="text-[10px] text-muted-foreground">Désactiver pour facturer 100% en une seule fois</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={depositRequired}
                onClick={() => setDepositRequired((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${depositRequired ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${depositRequired ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            {/* Conditions particulières (texte libre) */}
            <div className="space-y-1">
              <Label className="text-xs">Conditions particulières (ajoutées au contrat)</Label>
              <Textarea
                value={customClauses}
                onChange={(e) => setCustomClauses(e.target.value)}
                rows={4}
                className="text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Apparaît dans une section « Conditions particulières » du contrat (visible côté client). Vide = aucune.
              </p>
            </div>

            {/* Édition des articles standards des CG (cas rares) */}
            <details className="border border-border/60 rounded-md bg-muted/30">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium select-none flex items-center gap-2 hover:bg-muted/50 transition">
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Personnaliser les articles du contrat (avancé)
                {Object.keys(articleOverrides).length > 0 && (
                  <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {Object.keys(articleOverrides).length} modif.
                  </span>
                )}
              </summary>
              <div className="p-3 space-y-4">
                <p className="text-[11px] text-muted-foreground">
                  Modifiez ou supprimez uniquement les articles à ajuster (ex : droit à l'image). Les articles supprimés
                  ne seront pas affichés et la numérotation sera mise à jour automatiquement.
                </p>
                {DEFAULT_CLAUSES.map((clause, idx) => {
                  const raw = articleOverrides[clause.key] ?? "";
                  const isRemoved = raw === REMOVED_CLAUSE;
                  const isOverridden = !isRemoved && raw.trim().length > 0;
                  const visibleIndex = DEFAULT_CLAUSES.slice(0, idx + 1).filter(
                    (c) => articleOverrides[c.key] !== REMOVED_CLAUSE,
                  ).length;
                  const dynamicTitle = isRemoved
                    ? clause.title
                    : clause.title.replace(/^Article\s+\d+\./i, `Article ${visibleIndex}.`);
                  return (
                    <div
                      key={clause.key}
                      className="space-y-2 border-l-2 pl-3"
                      style={{
                        borderColor: isRemoved
                          ? "hsl(var(--destructive))"
                          : isOverridden
                            ? "hsl(var(--primary))"
                            : "hsl(var(--border))",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Label
                          className={cn("text-xs font-semibold", isRemoved && "line-through text-muted-foreground")}
                        >
                          {dynamicTitle}
                          {isRemoved && <span className="ml-2 text-[10px] text-destructive">(supprimé)</span>}
                          {isOverridden && <span className="ml-2 text-[10px] text-primary">(modifié)</span>}
                        </Label>
                        <div className="flex gap-1">
                          {!isOverridden && !isRemoved && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={() => setArticleOverrides((o) => ({ ...o, [clause.key]: clause.defaultHtml }))}
                              >
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-destructive"
                                onClick={() => setArticleOverrides((o) => ({ ...o, [clause.key]: REMOVED_CLAUSE }))}
                              >
                                Supprimer
                              </Button>
                            </>
                          )}
                          {isOverridden && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] text-destructive"
                                onClick={() => setArticleOverrides((o) => ({ ...o, [clause.key]: REMOVED_CLAUSE }))}
                              >
                                Supprimer
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={() =>
                                  setArticleOverrides((o) => {
                                    const n = { ...o };
                                    delete n[clause.key as ClauseKey];
                                    return n;
                                  })
                                }
                              >
                                Réinitialiser
                              </Button>
                            </>
                          )}
                          {isRemoved && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() =>
                                setArticleOverrides((o) => {
                                  const n = { ...o };
                                  delete n[clause.key as ClauseKey];
                                  return n;
                                })
                              }
                            >
                              Restaurer
                            </Button>
                          )}
                        </div>
                      </div>
                      {isOverridden && (
                        <>
                          <RichTextEditor
                            value={raw}
                            onChange={(html) => setArticleOverrides((o) => ({ ...o, [clause.key]: html }))}
                            minHeight="160px"
                          />
                          {clause.key === "art5" && (
                            <p className="text-[10px] text-muted-foreground">
                              Astuce : la mention <code>{"{{PRICE_CLAUSE}}"}</code> est remplacée automatiquement par la
                              clause d'acompte.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>

            <Button className="w-full" onClick={handleSaveContract} disabled={saving}>
              {saving ? "Sauvegarde…" : editingContract ? "Mettre à jour" : "Créer le contrat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CRM speaker picker for contract lines */}
      <Dialog open={speakerPickerOpen} onOpenChange={setSpeakerPickerOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">Ajouter un conférencier (CRM)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="Rechercher un conférencier…"
              value={speakerPickerSearch}
              onChange={(e) => setSpeakerPickerSearch(e.target.value)}
              autoFocus
            />
            <div className="flex-1 overflow-y-auto border border-border/60 rounded-md divide-y divide-border/40">
              {allSpeakers
                .filter(
                  (sp) =>
                    !speakerPickerSearch ||
                    sp.name.toLowerCase().includes(speakerPickerSearch.toLowerCase()) ||
                    (sp.city || "").toLowerCase().includes(speakerPickerSearch.toLowerCase()),
                )
                .slice(0, 200)
                .map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => addSpeakerLineFromCRM(sp)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/60 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sp.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {sp.city || "—"}
                        {sp.email ? ` · ${sp.email}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary shrink-0">
                      {sp.base_fee ? `${sp.base_fee.toLocaleString("fr-FR")} €` : "—"}
                    </span>
                  </button>
                ))}
              {allSpeakers.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground italic text-center">Chargement des conférenciers…</p>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Le tarif de base et le nom seront pré-remplis depuis la fiche CRM.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract email dialog with client selector */}
      <Dialog open={contractEmailOpen} onOpenChange={setContractEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Envoyer le contrat - {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Auto-linked recipient from proposal */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <User className="h-3.5 w-3.5" /> Destinataire (lié à la proposition)
              </div>
              <p className="font-medium">
                {proposal.recipient_name || proposal.client_name}
                <span className="text-muted-foreground font-normal"> &lt;{proposal.client_email}&gt;</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Objet</Label>
              <Input value={contractEmailSubject} onChange={(e) => setContractEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Corps du mail</Label>
              <Textarea
                value={contractEmailBody}
                onChange={(e) => setContractEmailBody(e.target.value)}
                rows={12}
                className="text-sm"
              />
            </div>

            {/* Recap */}
            <div className="bg-muted/30 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
              <p>
                🎤 <strong>Conférencier :</strong> {speakerSummary}
              </p>
              {getContractSignUrl() && (
                <p>
                  🔗 <strong>Lien signature :</strong> {getContractSignUrl()}
                </p>
              )}
            </div>

            <Button className="w-full" onClick={handleSendContractEmail} disabled={sendingContract}>
              <Send className="h-4 w-4 mr-2" />
              {sendingContract ? "Envoi…" : "Envoyer le contrat"}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">À</Label>
                <Input
                  value={speakerEmailTo}
                  onChange={(e) => setSpeakerEmailTo(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cc (séparés par virgule)</Label>
                <Input
                  value={speakerEmailCc}
                  onChange={(e) => setSpeakerEmailCc(e.target.value)}
                  placeholder="copie1@exemple.com, copie2@exemple.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Adressage</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSpeakerEmailAddressing("informal");
                    setSpeakerEmailBody(buildSpeakerEmailBody(speakerEmailType, "informal"));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${speakerEmailAddressing === "informal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  Tutoiement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpeakerEmailAddressing("formal");
                    setSpeakerEmailBody(buildSpeakerEmailBody(speakerEmailType, "formal"));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${speakerEmailAddressing === "formal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  Vouvoiement
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Objet</Label>
              <Input value={speakerEmailSubject} onChange={(e) => setSpeakerEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Corps du mail</Label>
              <RichTextEditor value={speakerEmailBody} onChange={setSpeakerEmailBody} />
            </div>
            <Button className="w-full" onClick={handleSendSpeakerEmail} disabled={sendingSpeakerEmail}>
              <Send className="h-4 w-4 mr-2" />
              {sendingSpeakerEmail ? "Envoi…" : "Envoyer au conférencier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liaison sheet dialog */}
      <Dialog open={liaisonDialogOpen} onOpenChange={setLiaisonDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Feuille de liaison - {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Liaison details - matching the DOCX template fields */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">📋 Champs de la feuille de liaison</Label>
                <p className="text-[10px] text-muted-foreground italic">
                  Ces valeurs mettent à jour le contrat à l'envoi.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">📅 Date</Label>
                  <Input
                    type="date"
                    value={liaisonEventDate}
                    onChange={(e) => setLiaisonEventDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">🕐 Horaires</Label>
                  <Input
                    value={liaisonEventTime}
                    onChange={(e) => setLiaisonEventTime(e.target.value)}
                    placeholder="9h-12h"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">📍 Lieu</Label>
                  <Input
                    value={liaisonEventLocation}
                    onChange={(e) => setLiaisonEventLocation(e.target.value)}
                    placeholder="Marseille"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">👥 Auditoire</Label>
                  <Input
                    value={liaisonAudience}
                    onChange={(e) => setLiaisonAudience(e.target.value)}
                    placeholder="100 personnes"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">🎯 Thématique</Label>
                  <Input
                    value={liaisonTheme}
                    onChange={(e) => setLiaisonTheme(e.target.value)}
                    placeholder="Le management"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">🚗 Arrivée</Label>
                <Input
                  value={liaisonArrival}
                  onChange={(e) => setLiaisonArrival(e.target.value)}
                  placeholder="environ 10H"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">🔧 Besoins logistiques</Label>
                <Textarea
                  value={liaisonTechNeeds}
                  onChange={(e) => setLiaisonTechNeeds(e.target.value)}
                  placeholder="Vidéoprojecteur&#10;Micro casque"
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">💬 Commentaires</Label>
                <Textarea
                  value={liaisonNotes}
                  onChange={(e) => setLiaisonNotes(e.target.value)}
                  rows={6}
                  className="text-sm min-h-[160px]"
                  placeholder="Le conférencier restera pour le déjeuner..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    await persistLiaisonFields();
                    await fetchData();
                    toast.success("Modifications enregistrées");
                  }}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> Enregistrer les modifications
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewLiaisonSheet}
                  className="gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" /> Aperçu de la feuille
                </Button>
              </div>
            </div>

            {/* Email tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setLiaisonTab("client")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${liaisonTab === "client" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                📧 Email Client{" "}
                {event?.liaison_email_client_sent_at && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              </button>
              <button
                onClick={() => setLiaisonTab("speaker")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${liaisonTab === "speaker" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                🎤 Email Conférencier{" "}
                {event?.liaison_email_speaker_sent_at && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              </button>
            </div>

            {liaisonTab === "client" ? (
              event?.liaison_email_client_sent_at ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Email client envoyé le {formatDate(event.liaison_email_client_sent_at)}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">À</Label>
                    <Input
                      value={liaisonClientTo}
                      onChange={(e) => setLiaisonClientTo(e.target.value)}
                      placeholder="client@email.com"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CC (copie pour le mail client)</Label>
                    <Input
                      value={liaisonClientCc}
                      onChange={(e) => setLiaisonClientCc(e.target.value)}
                      placeholder="conferencier@email.com"
                      className="text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">Séparez les adresses par une virgule</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Objet</Label>
                    <Input value={liaisonClientSubject} onChange={(e) => setLiaisonClientSubject(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Corps du mail</Label>
                    <Textarea
                      value={liaisonClientBody}
                      onChange={(e) => setLiaisonClientBody(e.target.value)}
                      rows={10}
                      className="text-sm"
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleSendLiaisonEmail("client")} disabled={sendingLiaison}>
                    <Send className="h-4 w-4 mr-2" />
                    {sendingLiaison ? "Envoi…" : "Envoyer au client"}
                  </Button>
                </div>
              )
            ) : event?.liaison_email_speaker_sent_at ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Email conférencier envoyé le {formatDate(event.liaison_email_speaker_sent_at)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">À</Label>
                  <Input
                    value={liaisonSpeakerTo}
                    onChange={(e) => setLiaisonSpeakerTo(e.target.value)}
                    placeholder="conferencier@email.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CC (copie pour le mail conférencier)</Label>
                  <Input
                    value={liaisonSpeakerCc}
                    onChange={(e) => setLiaisonSpeakerCc(e.target.value)}
                    placeholder="client@email.com"
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Séparez les adresses par une virgule</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tutoiement ou Vouvoiement</Label>
                  <Select
                    value={liaisonAddressing}
                    onValueChange={(v: "formal" | "informal") => {
                      const speaker = getSelectedSpeakerInfo();
                      const firstName = (speaker?.name || "").split(" ")[0];
                      const next = buildLiaisonSpeakerBody(v, firstName);
                      if (
                        liaisonSpeakerBody &&
                        liaisonSpeakerBody !== buildLiaisonSpeakerBody(liaisonAddressing, firstName)
                      ) {
                        if (
                          !window.confirm(
                            "Régénérer le brouillon avec le nouveau choix ? Vos modifications seront perdues.",
                          )
                        )
                          return;
                      }
                      setLiaisonAddressing(v);
                      setLiaisonSpeakerBody(next);
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Vouvoiement</SelectItem>
                      <SelectItem value="informal">Tutoiement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Objet</Label>
                  <Input value={liaisonSpeakerSubject} onChange={(e) => setLiaisonSpeakerSubject(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Corps du mail</Label>
                  <RichTextEditor value={liaisonSpeakerBody} onChange={setLiaisonSpeakerBody} />
                </div>
                <Button className="w-full" onClick={() => handleSendLiaisonEmail("speaker")} disabled={sendingLiaison}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendingLiaison ? "Envoi…" : "Envoyer au conférencier"}
                </Button>
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-3 text-[10px] text-muted-foreground space-y-1">
              <p>
                📧 <strong>Client :</strong> {liaisonClientTo || "—"}
                {liaisonClientCc ? ` (CC: ${liaisonClientCc})` : ""}
              </p>
              <p>
                🎤 <strong>Conférencier :</strong> {liaisonSpeakerTo || "—"}
                {liaisonSpeakerCc ? ` (CC: ${liaisonSpeakerCc})` : ""}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event edit dialog */}
      <Dialog open={eventEditOpen} onOpenChange={setEventEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Suivi du dossier - {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Section: Événement */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">📋 Événement</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Titre de l'événement</Label>
                  <Input
                    value={editEventTitle}
                    onChange={(e) => setEditEventTitle(e.target.value)}
                    placeholder="Séminaire annuel, Congrès RH…"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">N° BDC</Label>
                  <Input
                    value={editBdcNumber}
                    onChange={(e) => setEditBdcNumber(e.target.value)}
                    placeholder="BDC-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Thématique</Label>
                  <Input value={editTheme} onChange={(e) => setEditTheme(e.target.value)} placeholder="Le management" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Auditoire</Label>
                  <Input
                    value={editAudienceSize}
                    onChange={(e) => setEditAudienceSize(e.target.value)}
                    placeholder="100 personnes"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dress code</Label>
                <Input
                  value={editDressCode}
                  onChange={(e) => setEditDressCode(e.target.value)}
                  placeholder="Tenue de ville, casual…"
                />
              </div>
            </div>

            {/* Section: Conférence */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">🎤 Conférence</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Titre de la conférence</Label>
                  <Input
                    value={editConferenceTitle}
                    onChange={(e) => setEditConferenceTitle(e.target.value)}
                    placeholder="L'Art du Leadership"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Durée</Label>
                  <Input
                    value={editConferenceDuration}
                    onChange={(e) => setEditConferenceDuration(e.target.value)}
                    placeholder="1h00, 1h30…"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Budget conférencier (€ HT)</Label>
                <Input
                  type="number"
                  value={editSpeakerBudget}
                  onChange={(e) => setEditSpeakerBudget(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>

            {/* Section: Contact sur place */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">👤 Contact sur place (client)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input
                    value={editContactOnSiteName}
                    onChange={(e) => setEditContactOnSiteName(e.target.value)}
                    placeholder="Marie Dupont"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Téléphone</Label>
                  <Input
                    value={editContactOnSitePhone}
                    onChange={(e) => setEditContactOnSitePhone(e.target.value)}
                    placeholder="06 XX XX XX XX"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={editContactOnSiteEmail}
                    onChange={(e) => setEditContactOnSiteEmail(e.target.value)}
                    placeholder="marie@societe.com"
                  />
                </div>
              </div>
            </div>

            {/* Section: Logistique */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">🚗 Logistique</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Arrivée / accueil</Label>
                  <Input
                    value={editArrivalInfo}
                    onChange={(e) => setEditArrivalInfo(e.target.value)}
                    placeholder="Accueil à 9h00 hall A"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Parking</Label>
                  <Input
                    value={editParkingInfo}
                    onChange={(e) => setEditParkingInfo(e.target.value)}
                    placeholder="Parking souterrain, badge à l'accueil"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hôtel</Label>
                <Input
                  value={editHotelInfo}
                  onChange={(e) => setEditHotelInfo(e.target.value)}
                  placeholder="Hôtel Marriott - réservation confirmée"
                />
              </div>
            </div>

            {/* Section: Besoins logistiques */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">🔧 Besoins logistiques</Label>
              <div className="space-y-1">
                <Textarea
                  value={editTechNeeds}
                  onChange={(e) => {
                    setEditTechNeeds(e.target.value);
                    setEditRoomSetup("");
                  }}
                  rows={3}
                  placeholder="Vidéoprojecteur, micro casque, configuration salle…"
                />
              </div>
            </div>

            {/* Section: Visio prépa */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">📹 Visio préparatoire</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date visio</Label>
                  <Input type="date" value={editVisioDate} onChange={(e) => setEditVisioDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Heure</Label>
                  <Input value={editVisioTime} onChange={(e) => setEditVisioTime(e.target.value)} placeholder="10h00" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes visio</Label>
                <Textarea value={editVisioNotes} onChange={(e) => setEditVisioNotes(e.target.value)} rows={2} />
              </div>
            </div>

            {/* Section: Suivi des dates clés (chronologie dossier) */}
            <div className="space-y-3 border border-border rounded-lg p-3 bg-muted/20">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                📅 Suivi du dossier (dates clés)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date de l'événement</Label>
                  <Input type="date" value={editEventRealDate} onChange={(e) => setEditEventRealDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contrat client signé reçu le</Label>
                  <Input
                    type="date"
                    value={editClientSignedReceivedAt}
                    onChange={(e) => setEditClientSignedReceivedAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">AR conférencier reçu le</Label>
                  <Input
                    type="date"
                    value={editSpeakerAcknowledgmentAt}
                    onChange={(e) => setEditSpeakerAcknowledgmentAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contrat conférencier signé le</Label>
                  <Input
                    type="date"
                    value={editSpeakerSignedAt}
                    onChange={(e) => setEditSpeakerSignedAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Acompte payé par le client le</Label>
                  <Input
                    type="date"
                    value={editClientDepositPaidAt}
                    onChange={(e) => setEditClientDepositPaidAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Acompte versé au conférencier le</Label>
                  <Input
                    type="date"
                    value={editSpeakerDepositPaidAt}
                    onChange={(e) => setEditSpeakerDepositPaidAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Feuille de liaison envoyée le</Label>
                  <Input
                    type="date"
                    value={editLiaisonSheetSentAt}
                    onChange={(e) => setEditLiaisonSheetSentAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Facture envoyée au client le</Label>
                  <Input
                    type="date"
                    value={editClientInvoiceSentAt}
                    onChange={(e) => setEditClientInvoiceSentAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Facture payée par le client le</Label>
                  <Input
                    type="date"
                    value={editClientInvoicePaidAt}
                    onChange={(e) => setEditClientInvoicePaidAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Conférencier payé le</Label>
                  <Input type="date" value={editSpeakerPaidAt} onChange={(e) => setEditSpeakerPaidAt(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Infos logistiques (reportées dans la feuille de liaison)</Label>
                <Textarea
                  value={editLogisticsInfo}
                  onChange={(e) => setEditLogisticsInfo(e.target.value)}
                  rows={3}
                  placeholder="Ex. : le conférencier vient en voiture, hôtel réservé au Marriott le 12, train arrivée 9h15…"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ces dates et infos alimentent automatiquement la vue chronologique des dossiers événement.
              </p>
            </div>

            {/* Section: Demandes spéciales */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">📝 Notes & demandes</Label>
              <div className="space-y-1">
                <Label className="text-xs">Demandes spéciales</Label>
                <Textarea
                  value={editSpecialRequests}
                  onChange={(e) => setEditSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="Régime alimentaire, accessibilité…"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes internes</Label>
                <Textarea value={editEventNotes} onChange={(e) => setEditEventNotes(e.target.value)} rows={3} />
              </div>
            </div>

            <Button className="w-full" onClick={handleSaveEvent}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice creation dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Créer une facture - {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {(() => {
              const hasAcompte = invoices.some((i) => i.invoice_type === "acompte");
              const onlySolde = hasAcompte;
              const types = onlySolde ? (["solde"] as const) : (["acompte", "solde", "total"] as const);
              return (
                <div className="space-y-2">
                  <Label className="text-xs">Type de facture</Label>
                  {onlySolde && (
                    <p className="text-xs text-muted-foreground">
                      Une facture d'acompte a déjà été émise — seul le solde reste à facturer.
                    </p>
                  )}
                  <div className={`grid gap-2 ${onlySolde ? "grid-cols-1" : "grid-cols-3"}`}>
                    {types.map((t) => (
                      <button
                        key={t}
                        onClick={() => setInvoiceType(t)}
                        className={`px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${invoiceType === t ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"}`}
                      >
                        {t === "acompte" ? "Acompte 50%" : t === "solde" ? "Solde 50%" : "Total 100%"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="space-y-1">
              <Label className="text-xs">Date d'échéance</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes internes (non visibles sur la facture)</Label>
              <Textarea
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span>
                  {(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5)).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total TTC</span>
                <span>
                  {(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5) * 1.2).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  €
                </span>
              </div>
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
          <DialogHeader>
            <DialogTitle className="font-serif">Modifier {editingInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Montant HT (€)</Label>
                <Input type="number" value={editAmountHT} onChange={(e) => setEditAmountHT(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">TVA</Label>
                <Select value={String(editTvaRate)} onValueChange={(v) => setEditTvaRate(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TVA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date d'échéance</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estimation frais VHR (€) — optionnel</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={editVhrEstimate}
                onChange={(e) => setEditVhrEstimate(e.target.value === "" ? "" : Number(e.target.value))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Voyage / Hébergement / Restauration. Ajoutée à la facture si renseignée.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between font-bold">
              <span>Total TTC</span>
              <span>
                {((editAmountHT + (Number(editVhrEstimate) || 0)) * (1 + editTvaRate / 100)).toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </span>
            </div>
            <Button className="w-full" onClick={handleSaveInvoice}>
              Mettre à jour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice email dialog */}
      <Dialog open={invoiceEmailOpen} onOpenChange={setInvoiceEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Envoyer {emailInvoice?.invoice_number} - {proposal.client_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">À</Label>
                <Input
                  value={invoiceRecipientEmail}
                  onChange={(e) => setInvoiceRecipientEmail(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Contact</Label>
                <Input
                  value={invoiceRecipientName}
                  onChange={(e) => setInvoiceRecipientName(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Objet</Label>
              <Input value={invoiceEmailSubject} onChange={(e) => setInvoiceEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Corps du mail</Label>
              <Textarea
                value={invoiceEmailBody}
                onChange={(e) => setInvoiceEmailBody(e.target.value)}
                rows={12}
                className="text-sm"
              />
            </div>
            <Button className="w-full" onClick={handleSendInvoiceEmail} disabled={sendingInvoice}>
              <Send className="h-4 w-4 mr-2" />
              {sendingInvoice ? "Envoi…" : `Envoyer la facture`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDossier;
