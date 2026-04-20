import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Mic, Building2, FileText as FileTextIcon, ClipboardCheck } from "lucide-react";
import nugget from "@/assets/nugget.png";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminSpeakersCRM from "@/components/admin/AdminSpeakersCRM";
import AdminClients from "@/components/admin/AdminClients";
import AdminEventDossiers from "@/components/admin/AdminEventDossiers";

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
              <FileTextIcon className="h-4 w-4" /> Propositions
            </TabsTrigger>
            <TabsTrigger value="contrats" className="gap-2">
              <ClipboardCheck className="h-4 w-4" /> Dossiers événement
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

          <TabsContent value="contrats">
            <AdminEventDossiers />
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
import { Plus, Send, Trash2, ExternalLink, Copy, Check, RefreshCw, Archive, User, ChevronDown, ChevronUp, Pencil, Search, ArrowUpDown, Filter, Eye, EyeOff, Save, FileText, Bell, CalendarDays } from "lucide-react";
import EventDossier from "@/components/admin/EventDossier";
import { toast } from "sonner";

const getDefaultMessage = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nSuite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.\n\nVous trouverez ci-joint un fichier PDF présentant une sélection de conférenciers, sous réserve de leur disponibilité.\n\nLes tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.\n\nJe reste bien entendu à votre disposition pour tout complément d'information. Et si aucun de ces profils ne correspondait pleinement à vos attentes, nous pourrions poursuivre ensemble les recherches afin d'identifier l'intervenant idéal.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers`;

const getDefaultEmailSubject = (clientName: string) =>
  `Votre sélection de conférenciers sur mesure - ${clientName || "Les Conférenciers"}`;

const buildEventContextLine = (eventLocation: string, eventDateText: string, audienceSize: string) => {
  if (!eventLocation && !eventDateText && !audienceSize) return "";
  const parts: string[] = [];
  if (eventDateText) parts.push(`du <strong>${eventDateText}</strong>`);
  if (eventLocation) parts.push(`qui se tiendra à <strong>${eventLocation}</strong>`);
  if (audienceSize) parts.push(`devant un auditoire d'environ <strong>${audienceSize} personnes</strong>`);
  return `Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour votre événement ${parts.join(", ")}.`;
};

const TEMPLATE_EMAIL_PHRASES: Record<string, string> = {
  "Chefs d'orchestre": "une sélection de chefs d'orchestre et directeurs musicaux, conférenciers d'exception, soigneusement choisis",
  "GIGN / RAID": "une sélection de conférenciers issus des unités d'élite (GIGN, RAID), soigneusement choisis",
  "Patrouille de France": "une sélection de pilotes et anciens membres de la Patrouille de France, conférenciers d'exception, soigneusement choisis",
};

const getDefaultEmailBody = (recipientName: string, clientName: string, eventContext?: string, _templateName?: string) => {
  return `<p>Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},</p>

<p>Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.</p>

${eventContext ? `<p>${eventContext}</p>

` : ""}<p>Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.</p>

<p><strong>👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.</strong></p>

<p>Je reste bien entendu à votre disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
};

const getUniqueEmailBody = (recipientName: string, speakerName: string, totalAmount: string, speakerSlug: string, eventDateText?: string, eventLocation?: string, audienceSize?: string) => {
  const hasEventContext = eventDateText || eventLocation || audienceSize;
  const contextParts: string[] = [];
  if (eventDateText) contextParts.push(`du <strong>${eventDateText}</strong>`);
  if (eventLocation) contextParts.push(`à <strong>${eventLocation}</strong>`);
  if (audienceSize) contextParts.push(`pour <strong>${audienceSize} personnes</strong>`);
  
  const introPhrase = hasEventContext
    ? `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants ${contextParts.join(" ")} et vous adresse, comme convenu, le profil de ${speakerName}.`
    : `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants et vous adresse, comme convenu, le profil de ${speakerName}.`;

  const alternativePhrase = hasEventContext
    ? `<p>Si toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d'autres intervenants adaptés à vos critères.</p>`
    : `<p>Si toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d'autres intervenants adaptés à vos critères.<br>À ce titre, pourriez-vous m'indiquer la taille de l'auditoire envisagé ainsi que l'enveloppe budgétaire disponible ?</p>`;

  return `<p>Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},</p>

<p>Je fais suite à votre mail et à ma tentative de vous joindre par téléphone.</p>

<p>${introPhrase} Le tarif de son intervention est de ${totalAmount} € HT, hors frais VHR.</p>

<p><strong>👉 <a href="https://www.lesconferenciers.com/conferencier/${speakerSlug}" target="_blank" rel="noopener noreferrer">Découvrir le profil de ${speakerName}</a></strong> (sous réserve de sa disponibilité)</p>

${alternativePhrase}

<p>Je reste bien entendu à votre entière disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
};

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

const hasHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);
const escapeEmailHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const getProposalSpeakerTotal = (speaker?: Pick<ProposalSpeaker, "total_price" | "speaker_fee" | "travel_costs" | "agency_commission"> | null) =>
  speaker?.total_price ?? ((speaker?.speaker_fee || 0) + (speaker?.travel_costs || 0) + (speaker?.agency_commission || 0));
const toEmailBodyHtml = (value: string) => {
  if (!value?.trim()) return "";
  if (hasHtmlContent(value)) return value;

  return escapeEmailHtml(value)
    .replace(/\n/g, "<br>");
};

const getResolvedEmailSubject = (type: ProposalType, subject: string, clientName: string) => {
  if (subject?.trim()) return subject;
  if (type === "info") return `Demande d'informations - ${clientName || "Les Conférenciers"}`;
  if (type === "unique") return `Votre conférencier sur mesure - ${clientName || "Les Conférenciers"}`;
  return getDefaultEmailSubject(clientName);
};

const getResolvedEmailBody = ({
  type,
  body,
  recipientName,
  clientName,
  selectedSpeakers,
  speakers,
  eventContext,
  eventDateText,
  eventLocation,
  audienceSize,
}: {
  type: ProposalType;
  body: string;
  recipientName: string;
  clientName: string;
  selectedSpeakers: ProposalSpeaker[];
  speakers: Speaker[];
  eventContext?: string;
  eventDateText?: string;
  eventLocation?: string;
  audienceSize?: string;
}) => {
  if (body?.trim()) return body;
  if (type === "info") return getInfoEmailBody(recipientName);
  if (type === "unique") {
    const proposalSpeaker = selectedSpeakers[0];
    if (!proposalSpeaker) return "";
    const speaker = speakers.find((item) => item.id === proposalSpeaker.speaker_id);
    return getUniqueEmailBody(
      recipientName,
      speaker?.name || "",
      getProposalSpeakerTotal(proposalSpeaker).toLocaleString("fr-FR"),
      speaker?.slug || "",
      eventDateText,
      eventLocation,
      audienceSize,
    );
  }

  return getDefaultEmailBody(recipientName, clientName, eventContext);
};

const EmailPreviewCard = ({
  to,
  subject,
  body,
  showProposalButton,
}: {
  to: string;
  subject: string;
  body: string;
  showProposalButton: boolean;
}) => {
  const bodyHtml = toEmailBodyHtml(body);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 text-xs text-muted-foreground space-y-1">
        <p><strong>De :</strong> Les Conférenciers &lt;nellysabde@lesconferenciers.com&gt;</p>
        <p><strong>À :</strong> {to || "-"}</p>
        <p><strong>Objet :</strong> {subject || "-"}</p>
      </div>
      <div className="bg-white">
        <div style={{ background: "#1a2332", padding: "20px 30px", textAlign: "center" }}>
          <span style={{ color: "#f5f0e8", fontSize: "20px", fontWeight: "bold", fontFamily: "Georgia, serif" }}>Agence Les Conférenciers</span>
        </div>
        <div style={{ padding: "30px 30px 20px" }}>
          <div style={{ color: "#333", fontSize: "15px", lineHeight: "1.6" }} className="[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          {showProposalButton && (
            <>
              <div style={{ textAlign: "center", margin: "30px 0" }}>
                <span style={{ display: "inline-block", background: "#1a2332", color: "#f5f0e8", padding: "14px 32px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold" }}>
                  Consulter la proposition complète
                </span>
              </div>
              <div style={{ background: "#f0f7ff", border: "1px solid #d0e3f7", borderRadius: "8px", padding: "16px", margin: "20px 0" }}>
                <p style={{ color: "#1a5276", fontSize: "13px", margin: 0, textAlign: "center" }}>
                  📅 Cette proposition est <strong>valable 30 jours</strong>. Vous pouvez y revenir autant de fois que vous le souhaitez et <strong>y répondre directement en ligne</strong>.
                </p>
              </div>
            </>
          )}
        </div>
        <div style={{ padding: "0 30px 30px" }}>
          <img src="https://www.lesconferenciers.com/images/les-conferenciers-signature.png" alt="Nelly SABDE | Agence Les Conférenciers" style={{ width: "100%", maxWidth: "500px", display: "block" }} />
        </div>
        <div style={{ background: "#1a2332", padding: "16px", textAlign: "center" }}>
          <p style={{ color: "#f5f0e8", opacity: 0.5, fontSize: "11px", margin: 0 }}>Proposition confidentielle - Les Conférenciers</p>
        </div>
      </div>
    </div>
  );
};

const AdminProposalsContent = () => {
  const [, setSearchParams] = useSearchParams();
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
  const [clientPhone, setClientPhone] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDateText, setEventDateText] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
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
  const [typeFilter, setTypeFilter] = useState<"all" | ProposalType>("all");
  const [dateSortAsc, setDateSortAsc] = useState(false);
  const [showCreatePreview, setShowCreatePreview] = useState(false);
  const [showEditPreview, setShowEditPreview] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientMode, setClientMode] = useState<"search" | "new">("new");
  const [allClients, setAllClients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; speaker_ids: string[]; is_preset: boolean }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [emailExistsWarning, setEmailExistsWarning] = useState<string | null>(null);
  const [proposalSearch, setProposalSearch] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [hideTestProposals, setHideTestProposals] = useState(true);
  const [proposalTasks, setProposalTasks] = useState<any[]>([]);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderProposal, setReminderProposal] = useState<Proposal | null>(null);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderBody, setReminderBody] = useState("");
  const [activeReminderNum, setActiveReminderNum] = useState<1 | 2>(1);
  const [infoAcceptDialogOpen, setInfoAcceptDialogOpen] = useState(false);
  const [infoAcceptProposalId, setInfoAcceptProposalId] = useState<string | null>(null);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [leadsDialogProposal, setLeadsDialogProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    Promise.all([fetchProposals(), fetchSpeakers(), fetchConferences(), fetchClients(), fetchTemplates(), fetchTasks(), fetchLeads()]);
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from("simulator_leads").select("*").order("created_at", { ascending: false });
    setAllLeads((data as any) || []);
  };

  const getMatchingLeads = (email: string) => {
    if (!email) return [];
    const norm = email.trim().toLowerCase();
    return allLeads.filter(l => (l.email || "").trim().toLowerCase() === norm);
  };

  // Auto-update email body when event details change
  useEffect(() => {
    if (proposalType === "unique") {
      const ps = selectedSpeakers[0];
      if (!ps) return;
      const speaker = speakers.find(s => s.id === ps.speaker_id);
      if (!speaker) return;
      setEmailBody(getUniqueEmailBody(recipientName, speaker.name, getProposalSpeakerTotal(ps).toLocaleString("fr-FR"), speaker.slug || "", eventDateText, eventLocation, audienceSize));
    } else if (proposalType === "classique") {
      const evtCtx = buildEventContextLine(eventLocation, eventDateText, audienceSize);
      const tpl = selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) : null;
      setEmailBody(getDefaultEmailBody(recipientName, clientName, evtCtx, tpl?.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDateText, eventLocation, audienceSize]);

  // Check if client email already exists in proposals or clients CRM
  useEffect(() => {
    if (!clientEmail || clientEmail.length < 5 || !clientEmail.includes("@")) {
      setEmailExistsWarning(null);
      return;
    }
    const timer = setTimeout(() => {
      const warnings: string[] = [];
      const existingProposals = proposals.filter(p => p.client_email?.toLowerCase() === clientEmail.toLowerCase());
      if (existingProposals.length > 0) {
        const latest = existingProposals[0];
        const dateStr = new Date(latest.created_at).toLocaleDateString("fr-FR");
        warnings.push(`${existingProposals.length} proposition(s) (dernière : ${dateStr}, statut : ${latest.status})`);
      }
      const existingClient = allClients.find(c => c.email?.toLowerCase() === clientEmail.toLowerCase());
      if (existingClient) {
        warnings.push(`client existant : ${existingClient.company_name}${existingClient.contact_name ? ` (${existingClient.contact_name})` : ""}`);
      }
      if (warnings.length > 0) {
        setEmailExistsWarning(`⚠️ Email déjà connu — ${warnings.join(" • ")}`);
      } else {
        setEmailExistsWarning(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientEmail, proposals, allClients]);

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

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, company_name, contact_name, email, phone, status").order("company_name");
    setAllClients(data || []);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from("proposal_templates").select("id, name, speaker_ids, is_preset").order("name");
    setTemplates((data as any) || []);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from("proposal_tasks").select("*").order("due_date");
    setProposalTasks((data as any) || []);
  };

  const createTasksForProposal = async (proposalId: string, sentAt: string, pType?: string) => {
    const sentDate = new Date(sentAt);
    const relance1Date = new Date(sentDate);
    relance1Date.setDate(relance1Date.getDate() + 7);
    
    const tasks: any[] = [
      { proposal_id: proposalId, task_type: "relance_1", due_date: relance1Date.toISOString().split("T")[0] },
    ];
    
    // No relance 2 for "info" type
    if (pType !== "info") {
      const relance2Date = new Date(sentDate);
      relance2Date.setDate(relance2Date.getDate() + 15);
      tasks.push({ proposal_id: proposalId, task_type: "relance_2", due_date: relance2Date.toISOString().split("T")[0] });
    }
    
    await supabase.from("proposal_tasks").insert(tasks as any);
    fetchTasks();
  };

  const getTasksForProposal = (proposalId: string) => proposalTasks.filter((t: any) => t.proposal_id === proposalId);

  const getReminderDefaultBody = (p: Proposal, num: 1 | 2) => {
    const firstName = p.recipient_name?.split(" ")[0] || "";
    const pType = (p as any).proposal_type || "classique";
    const speakerName = p.proposal_speakers?.[0]?.speakers?.name || "l'intervenant";

    if (pType === "unique") {
      if (num === 1) {
        return `<p>Bonjour,</p>
<p>J'espère que vous allez bien ! 🙂</p>
<p>Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d'intervenants.</p>
<p>Je souhaitais savoir si le profil de ${speakerName} avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.</p>
<p>Je reste bien évidemment à votre disposition si besoin est.</p>
<p>Dans l'attente de votre retour.</p>
<p>Très belle fin de journée à vous.</p>`;
      }
      return `<p>Bonjour,</p>
<p>Je reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants. 🙂</p>
<p>Je souhaitais savoir si l'intervention de ${speakerName} était toujours d'actualité.</p>
<p>Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.</p>
<p>Dans l'attente de votre retour, je vous souhaite une très belle fin de journée.</p>
<p>Bien à vous,</p>`;
    }

    if (pType === "info") {
      // Only relance 1 for info type
      return `<p>Bonjour,</p>
<p>Je reviens vers vous suite à votre retour et je me réjouis de notre future collaboration.</p>
<p>Afin d'avancer sur l'organisation de la venue de ${speakerName}, pouvez-vous me communiquer le numéro de RCS de l'entité à facturer, la taille de l'auditoire et les horaires souhaités.</p>
<p>Nous pourrons dans un second temps prévoir un échange avec l'intervenant.</p>
<p>Restant à votre écoute et dans l'attente de votre retour, je vous souhaite une excellente journée.</p>`;
    }

    // classique
    if (num === 1) {
      return `<p>Bonjour${firstName ? ` ${firstName}` : ""},</p>
<p>J'espère que vous allez bien !</p>
<p>Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d'intervenants 🙂</p>
<p>Je souhaitais savoir si un des profils avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.</p>
<p>Je reste bien évidemment à votre disposition si besoin est.</p>
<p>Dans l'attente de votre retour.</p>
<p>Très belle fin de journée à vous.</p>`;
    }
    return `<p>Bonjour${firstName ? ` ${firstName}` : ""},</p>
<p>Je reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants 🙂</p>
<p>Je souhaitais savoir si vous aviez pu avancer dans votre réflexion quant au choix de l'intervenant qui correspondrait le mieux à vos besoins.</p>
<p>Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.</p>
<p>Dans l'attente de votre retour, je vous souhaite une très belle fin de journée.</p>`;
  };

  const getReminderDefaultSubject = (p: Proposal, num: 1 | 2) => {
    return num === 1
      ? `Votre sélection de conférenciers - ${p.client_name}`
      : `Rappel : votre recherche d'intervenants - ${p.client_name}`;
  };

  const openReminderDialog = (p: Proposal) => {
    const tasks = getTasksForProposal(p.id);
    setReminderProposal(p);
    setEditingTasks(tasks.map((t: any) => ({ ...t })));
    setActiveReminderNum(1);
    setReminderSubject(getReminderDefaultSubject(p, 1));
    setReminderBody(getReminderDefaultBody(p, 1));
    setReminderDialogOpen(true);
  };

  const saveTaskEdits = async () => {
    for (const task of editingTasks) {
      await supabase.from("proposal_tasks").update({
        due_date: task.due_date,
        note: task.note || null,
      } as any).eq("id", task.id);
    }
    toast.success("Tâches mises à jour");
    fetchTasks();
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    const newSpeakers: ProposalSpeaker[] = tpl.speaker_ids
      .map((sid, idx) => {
        const sp = speakers.find(s => s.id === sid);
        if (!sp) return null;
        return createProposalSpeaker(sp, idx);
      })
      .filter(Boolean) as ProposalSpeaker[];
    setSelectedSpeakers(newSpeakers);
    // Update email body with template-specific phrase
    const evtCtx = buildEventContextLine(eventLocation, eventDateText, audienceSize);
    setEmailBody(getDefaultEmailBody(recipientName, clientName, evtCtx, tpl.name));
    toast.success(`Template "${tpl.name}" appliqué (${newSpeakers.length} conférenciers)`);
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

  const applyTypeFilter = (items: Proposal[]) => typeFilter === "all" ? items : items.filter(p => (p as any).proposal_type === typeFilter);
  const applyDateSort = (items: Proposal[]) => dateSortAsc ? [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : items;
  const isTestProposal = (p: Proposal) => p.client_name.toLowerCase().includes("test quotidien") || p.client_email.toLowerCase().includes("test quotidien");
  const applyHideTest = (items: Proposal[]) => hideTestProposals ? items.filter(p => !isTestProposal(p)) : items;
  const testProposalCount = proposals.filter(isTestProposal).length;
  const applySearch = (items: Proposal[]) => {
    const q = proposalSearch.toLowerCase().trim();
    if (!q) return items;
    return items.filter(p => {
      const speakerNames = (p.proposal_speakers || []).map((ps: any) => ps.speakers?.name || "").join(" ").toLowerCase();
      return p.client_name.toLowerCase().includes(q) ||
        p.client_email.toLowerCase().includes(q) ||
        (p.recipient_name || "").toLowerCase().includes(q) ||
        speakerNames.includes(q);
    });
  };
  const filterAndSort = (items: Proposal[]) => applyDateSort(applyTypeFilter(applySearch(applyHideTest(items))));

  const drafts = filterAndSort(proposals.filter(p => p.status === "draft"));
  const sent = filterAndSort(proposals.filter(p => p.status === "sent"));
  const accepted = filterAndSort(proposals.filter(p => p.status === "accepted"));
  const archived = filterAndSort(proposals.filter(p => p.status === "archived"));

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
    const nextSpeakers = addSpeakerToList(selectedSpeakers, speaker);
    setSelectedSpeakers(nextSpeakers);
    if (proposalType === "unique") {
      const total = getProposalSpeakerTotal(nextSpeakers[0]);
      setEmailBody(getUniqueEmailBody(recipientName, speaker.name, total.toLocaleString("fr-FR"), speaker.slug || "", eventDateText, eventLocation, audienceSize));
    }
  };

  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakers(prev => {
      const next = removeSpeakerFromList(prev, speakerId);
      if (proposalType === "unique") setEmailBody("");
      return next;
    });
  };

  const toggleConference = (speakerId: string, confId: string) => {
    setSelectedSpeakers(prev => toggleConferenceInList(prev, speakerId, confId));
  };

  const updateSpeakerField = (speakerId: string, field: keyof ProposalSpeaker, value: number | null) => {
    setSelectedSpeakers(prev => {
      const next = updateSpeakerFieldInList(prev, speakerId, field, value);
      if (proposalType === "unique" && next[0]) {
        const speaker = speakers.find(s => s.id === next[0].speaker_id);
        setEmailBody(getUniqueEmailBody(recipientName, speaker?.name || "", getProposalSpeakerTotal(next[0]).toLocaleString("fr-FR"), speaker?.slug || "", eventDateText, eventLocation, audienceSize));
      }
      return next;
    });
  };

  const getSpeakerName = (id: string) => speakers.find(s => s.id === id)?.name || "—";
  const getSpeakerImage = (id: string) => speakers.find(s => s.id === id)?.image_url || null;
  const getSpeakerCity = (id: string) => speakers.find(s => s.id === id)?.city || null;

  const handleCreate = async (andSend = false) => {
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

    // Auto-create or link client
    let clientId = selectedClientId;
    if (!clientId) {
      const { data: existingClients } = await supabase.from("clients").select("id, company_name").eq("email", clientEmail).limit(1);
      if (existingClients && existingClients.length > 0) {
        if (clientMode === "new") {
          toast.error(`Ce client existe déjà en base : "${existingClients[0].company_name}". Utilisez la recherche pour le sélectionner.`);
          setSubmitting(false);
          return;
        }
        clientId = existingClients[0].id;
      } else {
        const { data: newClient } = await supabase.from("clients").insert({
          company_name: clientName,
          contact_name: recipientName || null,
          email: clientEmail,
          phone: clientPhone || null,
          status: "prospect",
        }).select("id").single();
        if (newClient) clientId = newClient.id;
      }
    }

    const eventContext = buildEventContextLine(eventLocation, eventDateText, audienceSize);
    const finalMessage = proposalType === "classique" ? (emailBody || getDefaultEmailBody(recipientName, clientName, eventContext)) : "";
    const finalSubject = emailSubject || getDefaultEmailSubject(clientName);
    let finalBody = emailBody;
    if (!finalBody) {
      if (proposalType === "unique" && selectedSpeakers.length > 0) {
        const sp = speakers.find(s => s.id === selectedSpeakers[0].speaker_id);
        finalBody = getUniqueEmailBody(recipientName, sp?.name || "", getProposalSpeakerTotal(selectedSpeakers[0]).toLocaleString("fr-FR"), (sp as any)?.slug || "", eventDateText, eventLocation, audienceSize);
      } else if (proposalType === "info") {
        finalBody = getInfoEmailBody(recipientName);
      } else {
        finalBody = getDefaultEmailBody(recipientName, clientName, eventContext);
      }
    }
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({
        client_name: clientName, client_email: clientEmail, message: finalMessage,
        recipient_name: recipientName || null, email_subject: finalSubject, email_body: finalBody,
        proposal_type: proposalType, client_id: clientId,
        event_location: eventLocation || null, event_date_text: eventDateText || null,
        audience_size: audienceSize || null, client_phone: clientPhone || null,
      } as any)
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
    if (andSend) {
      try {
        const ccList = ccEmails.split(",").map(e => e.trim()).filter(e => e.includes("@"));
        const { error: sendErr } = await supabase.functions.invoke("send-proposal-email", { body: { proposal_id: proposal.id, cc: ccList.length > 0 ? ccList : undefined } });
        if (sendErr) throw sendErr;
        const sentAt = new Date().toISOString();
        await supabase.from("proposals").update({ status: "sent", sent_at: sentAt }).eq("id", proposal.id);
        await createTasksForProposal(proposal.id, sentAt, proposalType);
        toast.success("Proposition créée et envoyée !");
      } catch { toast.error("Proposition créée mais erreur d'envoi"); }
    } else {
      toast.success("Brouillon enregistré !");
    }
    setDialogOpen(false); resetForm(); fetchProposals(); fetchClients(); setSubmitting(false);
  };

  const resetForm = () => {
    setClientName(""); setClientEmail(""); setRecipientName(""); setSelectedSpeakers([]);
    setEmailSubject(""); setEmailBody(""); setMessage(getDefaultMessage("", ""));
    setProposalType("classique"); setGlobalCommission(0);
    setClientPhone(""); setEventLocation(""); setEventDateText(""); setAudienceSize("");
    setClientSearchQuery(""); setClientSearchResults([]); setSelectedClientId(null); setClientMode("new");
    setCcEmails("");
  };

  const openEditDialog = (p: Proposal) => {
    setEditingProposal(p);
    setEditClientName(p.client_name); setEditClientEmail(p.client_email);
    setEditRecipientName(p.recipient_name || "");
    const proposalSpeakers = buildProposalSpeakers(p.proposal_speakers);
    const pType = (p.proposal_type || "classique") as ProposalType;
    if (pType === "info") {
      setEditMessage("");
      setEditEmailSubject(p.email_subject || `Demande d'informations - ${p.client_name}`);
      setEditEmailBody(p.email_body || getInfoEmailBody(p.recipient_name || ""));
    } else if (pType === "unique") {
      setEditMessage("");
      setEditEmailSubject(p.email_subject || `Votre conférencier sur mesure - ${p.client_name}`);
      const uniqueSpeaker = proposalSpeakers[0];
      const speaker = speakers.find((item) => item.id === uniqueSpeaker?.speaker_id);
      setEditEmailBody(p.email_body || getUniqueEmailBody(p.recipient_name || "", speaker?.name || "", getProposalSpeakerTotal(uniqueSpeaker).toLocaleString("fr-FR"), speaker?.slug || "", (p as any).event_date_text, (p as any).event_location, (p as any).audience_size));
    } else {
      setEditMessage(p.message || getDefaultMessage(p.recipient_name || "", p.client_name));
      setEditEmailSubject(p.email_subject || getDefaultEmailSubject(p.client_name));
      setEditEmailBody(p.email_body || getDefaultEmailBody(p.recipient_name || "", p.client_name));
    }
    setEditSelectedSpeakers(proposalSpeakers);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (andSend = false) => {
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
      message: pType === "classique" ? (editEmailBody || null) : null,
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

    if (andSend) {
      try {
        const { error: sendErr } = await supabase.functions.invoke("send-proposal-email", { body: { proposal_id: editingProposal.id } });
        if (sendErr) throw sendErr;
        const sentAt = new Date().toISOString();
        await supabase.from("proposals").update({ status: "sent", sent_at: sentAt }).eq("id", editingProposal.id);
        // Create tasks if not yet existing
        const existingTasks = getTasksForProposal(editingProposal.id);
        if (existingTasks.length === 0) await createTasksForProposal(editingProposal.id, sentAt, (editingProposal as any).proposal_type);
        toast.success("Proposition sauvegardée et envoyée !");
      } catch { toast.error("Sauvegardée mais erreur d'envoi"); }
    } else {
      toast.success("Brouillon mis à jour !");
    }
    setEditDialogOpen(false); setEditingProposal(null); setEditSelectedSpeakers([]); fetchProposals(); setSubmitting(false);
  };

  const handleSend = async (proposal: Proposal) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-email", { body: { proposal_id: proposal.id } });
      if (error) throw error;
      const sentAt = new Date().toISOString();
      await supabase.from("proposals").update({ status: "sent", sent_at: sentAt }).eq("id", proposal.id);
      await createTasksForProposal(proposal.id, sentAt, (proposal as any).proposal_type);
      toast.success("Email envoyé !"); fetchProposals();
    } catch { toast.error("Erreur d'envoi"); }
    setSending(null);
  };

  const handleReminder = async (proposal: Proposal, reminderNum: 1 | 2, customSubject?: string, customBody?: string) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-reminder", {
        body: {
          proposal_id: proposal.id,
          reminder_number: reminderNum,
          custom_subject: customSubject || undefined,
          custom_html_body: customBody || undefined,
        },
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
    const proposal = proposals.find(p => p.id === id);
    if ((proposal as any)?.proposal_type === "info") {
      setInfoAcceptProposalId(id);
      setInfoAcceptDialogOpen(true);
      return;
    }
    await supabase.from("proposals").update({ status: "accepted" }).eq("id", id);
    toast.success("Proposition acceptée — retrouvez-la dans l'onglet Contrats");
    fetchProposals();
    setSearchParams({ tab: "contrats" });
  };

  const handleInfoAcceptConvert = async (newType: "classique" | "unique") => {
    if (!infoAcceptProposalId) return;
    const original = proposals.find(p => p.id === infoAcceptProposalId);
    if (!original) return;
    // Pre-fill a new proposal creation form with the client info
    resetForm();
    setClientName(original.client_name);
    setClientEmail(original.client_email);
    setRecipientName(original.recipient_name || "");
    setClientPhone((original as any).client_phone || "");
    setProposalType(newType);
    // Set email defaults
    if (newType === "classique") {
      setEmailSubject(getDefaultEmailSubject(original.client_name));
      setEmailBody(getDefaultEmailBody(original.recipient_name || "", original.client_name));
    }
    setClientMode("new");
    setInfoAcceptDialogOpen(false);
    setDialogOpen(true);
    // Mark the info proposal as archived
    await supabase.from("proposals").update({ status: "archived" }).eq("id", infoAcceptProposalId);
    fetchProposals();
    toast.info("Créez la proposition à partir des informations du client");
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
    setSelectedTemplateId(null);
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
    setSelectedSpeakers(prev => {
      const updated = prev.map(s => {
        const u = { ...s, agency_commission: val };
        u.total_price = (u.speaker_fee || 0) + (u.travel_costs || 0) + val || null;
        return u;
      });
      if (proposalType === "unique" && updated[0]) {
        const speaker = speakers.find(sp => sp.id === updated[0].speaker_id);
        setEmailBody(getUniqueEmailBody(recipientName, speaker?.name || "", getProposalSpeakerTotal(updated[0]).toLocaleString("fr-FR"), speaker?.slug || "", eventDateText, eventLocation, audienceSize));
      }
      return updated;
    });
  };

  const selectExistingClient = (client: any) => {
    setSelectedClientId(client.id);
    setClientName(client.company_name);
    setClientEmail(client.email || "");
    setRecipientName(client.contact_name || "");
    setClientPhone(client.phone || "");
    setClientMode("search");
  };

  const filteredClients = clientSearchQuery.trim()
    ? allClients.filter(c =>
        c.company_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        c.contact_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearchQuery.toLowerCase())
      )
    : [];

  const eventContext = buildEventContextLine(eventLocation, eventDateText, audienceSize);

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

        {/* Template selector for classique */}
        {proposalType === "classique" && templates.length > 0 && (
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground mb-1 block">📁 Appliquer un template</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTemplateId || ""}
              onChange={e => {
                if (e.target.value) applyTemplate(e.target.value);
                else { setSelectedTemplateId(null); }
              }}
            >
              <option value="">— Sélection libre —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.speaker_ids.length} conférenciers)</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Client search/create section */}
      <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
        <Label className="text-sm font-medium">👤 Client</Label>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setClientMode("new"); setSelectedClientId(null); }} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${clientMode === "new" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            Nouveau client
          </button>
          <button type="button" onClick={() => { setClientMode("search"); setSelectedClientId(null); }} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${clientMode === "search" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            Rechercher un client existant
          </button>
        </div>

        {clientMode === "search" && !selectedClientId && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={clientSearchQuery} onChange={e => setClientSearchQuery(e.target.value)} placeholder="Rechercher par nom, contact ou email…" className="pl-8 text-sm" />
            </div>
            {clientSearchQuery.trim() && (
              <div className="max-h-40 overflow-y-auto border border-input rounded-md">
                {filteredClients.map(c => (
                  <button key={c.id} type="button" onClick={() => selectExistingClient(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between border-b border-border last:border-0">
                    <div>
                      <span className="font-medium">{c.company_name}</span>
                      {c.contact_name && <span className="text-muted-foreground ml-2">({c.contact_name})</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
                {filteredClients.length === 0 && <div className="px-3 py-3 text-sm text-muted-foreground text-center">Aucun résultat — <button type="button" onClick={() => setClientMode("new")} className="text-primary underline">créer un nouveau client</button></div>}
              </div>
            )}
          </div>
        )}

        {selectedClientId && clientMode === "search" && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{clientName}</span>
            <span className="text-xs text-muted-foreground">{clientEmail}</span>
            <button type="button" onClick={() => { setSelectedClientId(null); setClientName(""); setClientEmail(""); setRecipientName(""); setClientPhone(""); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Changer</button>
          </div>
        )}

        {(clientMode === "new" || selectedClientId) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Société / Nom du client</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="SNCF" disabled={!!selectedClientId} /></div>
              <div className="space-y-1"><Label className="text-xs">Email du client</Label><Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@societe.com" disabled={!!selectedClientId} /></div>
            </div>
            {emailExistsWarning && (
              <div className="bg-amber-50 border border-amber-300 rounded-md px-3 py-1.5 text-xs text-amber-800">
                {emailExistsWarning}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Prénom Nom du destinataire</Label><Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Pascal DUPONT" /></div>
              <div className="space-y-1"><Label className="text-xs">Téléphone client</Label><Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="06 12 34 56 78" /></div>
            </div>
          </div>
        )}
      </div>

      {/* Event details - hidden for info type */}
      {proposalType !== "info" && <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
        <Label className="text-sm font-medium">📍 Détails de l'événement (optionnel)</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1"><Label className="text-xs">Date de l'événement</Label><Input value={eventDateText} onChange={e => setEventDateText(e.target.value)} placeholder="15 mars 2026" /></div>
          <div className="space-y-1"><Label className="text-xs">Lieu d'intervention</Label><Input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Paris" /></div>
          <div className="space-y-1"><Label className="text-xs">Taille de l'auditoire</Label><Input value={audienceSize} onChange={e => setAudienceSize(e.target.value)} placeholder="200" /></div>
        </div>
        {(eventDateText || eventLocation || audienceSize) && (() => {
          const contextParts: string[] = [];
          if (eventDateText) contextParts.push(`du <strong>${eventDateText}</strong>`);
          if (eventLocation) contextParts.push(`à <strong>${eventLocation}</strong>`);
          if (audienceSize) contextParts.push(`pour <strong>${audienceSize} personnes</strong>`);
          const previewText = proposalType === "unique"
            ? `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants ${contextParts.join(" ")}...`
            : `Vous trouverez ci-joint une sélection de conférenciers pour votre événement ${contextParts.join(", ")}.`;
          return (
            <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-xs text-foreground italic" dangerouslySetInnerHTML={{ __html: previewText }} />
          );
        })()}
      </div>}

      {/* Speakers section - not for "info" type - BEFORE email */}
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

      {/* Email section - AFTER speakers */}
      <div className="space-y-2">
        <Label>✉️ Email d'envoi - Objet</Label>
        <Input
          value={emailSubject || getResolvedEmailSubject(proposalType, "", clientName)}
          onChange={e => setEmailSubject(e.target.value)}
          placeholder="Objet de l'email"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Adresses en copie (CC)</Label>
        <Input
          value={ccEmails}
          onChange={e => setCcEmails(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
        />
        <p className="text-[10px] text-muted-foreground">Séparez les adresses par des virgules. Ces adresses ne seront pas ajoutées au CRM.</p>
      </div>
      <div className="space-y-2">
        <Label>✉️ Email d'envoi - Corps</Label>
        <SimpleRichTextEditor
          value={emailBody || getResolvedEmailBody({ type: proposalType, body: "", recipientName, clientName, selectedSpeakers, speakers, eventContext })}
          onChange={setEmailBody}
          placeholder="Corps de l'email..."
          rows={8}
        />
      </div>
      <div className="space-y-2">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setShowCreatePreview(!showCreatePreview)}>
          {showCreatePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showCreatePreview ? "Masquer l'aperçu" : "Aperçu réel de l'email envoyé"}
        </Button>
        {showCreatePreview && (
          <EmailPreviewCard
            to={clientEmail}
            subject={getResolvedEmailSubject(proposalType, emailSubject, clientName)}
            body={getResolvedEmailBody({ type: proposalType, body: emailBody, recipientName, clientName, selectedSpeakers, speakers, eventContext, eventDateText, eventLocation, audienceSize })}
            showProposalButton={proposalType === "classique"}
          />
        )}
      </div>

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={() => handleCreate(true)} disabled={submitting}>
          <Send className="h-4 w-4" />
          {submitting ? "Envoi…" : "Sauvegarder et envoyer"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => handleCreate(false)} disabled={submitting}>
          <Save className="h-4 w-4" />
          {submitting ? "Création…" : "Enregistrer le brouillon"}
        </Button>
      </div>
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
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{p.client_email}</span>
              {(() => {
                const matches = getMatchingLeads(p.client_email);
                if (matches.length === 0) return null;
                return (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLeadsDialogProposal(p); }}
                    title={`${matches.length} message${matches.length > 1 ? "s" : ""} client (lead)`}
                    className="inline-flex items-center gap-0.5 text-sky-600 hover:text-sky-800 transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{matches.length}</span>
                  </button>
                );
              })()}
            </div>
          </TableCell>
          <TableCell>
            {(() => {
              const speakersList = p.proposal_speakers || [];
              const maxVisible = 3;
              const visible = speakersList.slice(0, maxVisible);
              const remaining = speakersList.length - maxVisible;
              return (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {visible.map((ps, i) => {
                    const speaker = ps.speakers as any;
                    if (!speaker) return null;
                    return (
                      <div key={i} className="flex items-center gap-1" title={speaker.name}>
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {speaker.image_url ? <img src={speaker.image_url} alt={speaker.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><User className="h-3.5 w-3.5 text-muted-foreground" /></div>}
                        </div>
                        <span className="text-xs text-foreground whitespace-nowrap">{speaker.name}</span>
                        {i < visible.length - 1 && <span className="text-muted-foreground text-xs">·</span>}
                      </div>
                    );
                  })}
                  {remaining > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground" title={speakersList.slice(maxVisible).map((ps: any) => ps.speakers?.name).filter(Boolean).join(", ")}>
                      +{remaining}
                    </span>
                  )}
                  {speakersList.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      {(p as any).proposal_type === "info" ? "Demande d'infos" : "Aucun"}
                    </span>
                  )}
                </div>
              );
            })()}
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
                {(p as any).reminder1_sent_at && <div className="text-[10px] text-blue-600">Relance 1 ✓</div>}
                {(p as any).reminder2_sent_at && <div className="text-[10px] text-blue-600">Relance 2 ✓</div>}
                {(() => {
                  const tasks = getTasksForProposal(p.id);
                  const pendingTasks = tasks.filter((t: any) => t.status === "pending");
                  if (pendingTasks.length === 0) return null;
                  const nextTask = pendingTasks.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0];
                  const dueDate = new Date(nextTask.due_date);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const isOverdue = dueDate < today;
                  const isToday = dueDate.toDateString() === today.toDateString();
                  return (
                    <div className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : isToday ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                      <CalendarDays className="h-3 w-3" />
                      {nextTask.task_type === "relance_1" ? "R1" : "R2"}: {dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      {isOverdue && " ⚠️"}
                      {isToday && " 📌"}
                    </div>
                  );
                })()}
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
              {p.status !== "draft" && (p as any).proposal_type !== "info" && (
                <Button variant="ghost" size="sm" onClick={() => {
                  const printWindow = window.open(getProposalUrl(p.token) + "?print=true", "_blank");
                  if (printWindow) {
                    printWindow.addEventListener("afterprint", () => printWindow.close());
                  }
                }} title="Télécharger en PDF">
                  <FileText className="h-4 w-4" />
                </Button>
              )}
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
                  {!expired && (
                    <Button variant="outline" size="sm" className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => openReminderDialog(p)} title="Relances">
                      <Bell className="h-3 w-3" /> Relances
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
            <TableCell colSpan={6} className="bg-muted/30 px-6 py-2">
              <EventDossier
                proposal={{
                  id: p.id, client_name: p.client_name, client_email: p.client_email,
                  recipient_name: p.recipient_name, client_id: p.client_id || null, status: p.status,
                  proposal_type: (p as any).proposal_type || "classique",
                  event_date_text: (p as any).event_date_text || null,
                  event_location: (p as any).event_location || null,
                  audience_size: (p as any).audience_size || null,
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

  const renderUnifiedTable = (items: Proposal[]) => (
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
          {items.map(p => renderProposalRow(p, p.status === "draft" ? "draft" : "sent"))}
          {items.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                Aucune proposition.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

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
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
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
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-shrink-0" style={{ minWidth: 220 }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, speaker…"
              value={proposalSearch}
              onChange={e => setProposalSearch(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <p className="text-muted-foreground text-sm">{proposals.length} proposition{proposals.length !== 1 ? "s" : ""}</p>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
          >
            <option value="all">Tous les types</option>
            <option value="classique">📋 Classique</option>
            <option value="unique">🎤 Unique</option>
            <option value="info">📝 Infos</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => setDateSortAsc(prev => !prev)} className="gap-1 text-xs" title="Trier par date">
            <ArrowUpDown className="h-3.5 w-3.5" /> {dateSortAsc ? "Plus anciennes d'abord" : "Plus récentes d'abord"}
          </Button>
          {testProposalCount > 0 && (
            <Button variant={hideTestProposals ? "outline" : "secondary"} size="sm" onClick={() => setHideTestProposals(prev => !prev)} className="gap-1 text-xs">
              {hideTestProposals ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hideTestProposals ? `Afficher les tests (${testProposalCount})` : "Masquer les tests"}
            </Button>
          )}
        </div>
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

      {/* Liste unifiée triée par date desc — brouillons et envoyées affichés ensemble */}
      {(() => {
        const merged = [...drafts, ...sent].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return renderUnifiedTable(merged);
      })()}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Éditer la proposition</DialogTitle></DialogHeader>
          {(() => {
            const editType = (editingProposal?.proposal_type || "classique") as ProposalType;
            return (
              <div className="space-y-6 mt-4">
                <div className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground w-fit">
                  {editType === "unique" ? "🎤 Conférencier unique" : editType === "info" ? "📝 Demande d'infos" : "📋 Classique"}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Société / Nom du client</Label><Input value={editClientName} onChange={e => setEditClientName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email du client</Label><Input type="email" value={editClientEmail} onChange={e => setEditClientEmail(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Prénom Nom du destinataire</Label><Input value={editRecipientName} onChange={e => setEditRecipientName(e.target.value)} /></div>

                {editType !== "info" && (
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">🎤 Conférenciers et tarifs</h3>
                    {renderSpeakerSelectionEditor(editSelectedSpeakers, setEditSelectedSpeakers)}
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <h3 className="font-medium text-sm mb-3">✉️ Email d'envoi</h3>
                  <div className="space-y-3">
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Objet</Label><Input value={editEmailSubject} onChange={e => setEditEmailSubject(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-xs text-muted-foreground">Corps du mail</Label><SimpleRichTextEditor value={editEmailBody} onChange={setEditEmailBody} rows={10} /></div>
                     <div className="space-y-2">
                       <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setShowEditPreview(!showEditPreview)}>
                         {showEditPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         {showEditPreview ? "Masquer l'aperçu" : "Aperçu réel de l'email envoyé"}
                       </Button>
                       {showEditPreview && <EmailPreviewCard to={editClientEmail} subject={getResolvedEmailSubject(editType, editEmailSubject, editClientName)} body={getResolvedEmailBody({ type: editType, body: editEmailBody, recipientName: editRecipientName, clientName: editClientName, selectedSpeakers: editSelectedSpeakers, speakers, eventDateText: (editingProposal as any)?.event_date_text, eventLocation: (editingProposal as any)?.event_location, audienceSize: (editingProposal as any)?.audience_size })} showProposalButton={editType === "classique"} />}
                     </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 gap-2" onClick={() => handleSaveEdit(true)} disabled={submitting}>
                    <Send className="h-4 w-4" />
                    {submitting ? "Envoi…" : "Sauvegarder et envoyer"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => handleSaveEdit(false)} disabled={submitting}>
                    <Save className="h-4 w-4" />
                    {submitting ? "Sauvegarde…" : "Enregistrer le brouillon"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">🔔 Relances — {reminderProposal?.client_name}</DialogTitle></DialogHeader>
          {reminderProposal && (
            <div className="space-y-6 mt-4">
              {/* Client info */}
              <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                <p><strong>Client :</strong> {reminderProposal.client_name}</p>
                <p><strong>Email :</strong> {reminderProposal.client_email}</p>
                {reminderProposal.recipient_name && <p><strong>Destinataire :</strong> {reminderProposal.recipient_name}</p>}
                {(reminderProposal as any).client_phone && <p><strong>Tél :</strong> {(reminderProposal as any).client_phone}</p>}
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Tâches de relance</h3>
                {editingTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Aucune tâche créée pour cette proposition.</p>
                )}
                {editingTasks.map((task: any, idx: number) => (
                  <div key={task.id} className={`border rounded-lg p-4 space-y-3 ${task.status === "completed" ? "border-green-200 bg-green-50/50" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${task.task_type === "relance_1" ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"}`}>
                          {task.task_type === "relance_1" ? "Relance 1 (J+7)" : "Relance 2 (J+15)"}
                        </span>
                        {task.status === "completed" && <span className="text-xs text-green-600">✓ Envoyée</span>}
                        {(reminderProposal as any)[task.task_type === "relance_1" ? "reminder1_sent_at" : "reminder2_sent_at"] && (
                          <span className="text-[10px] text-blue-600">
                            Envoyée le {new Date((reminderProposal as any)[task.task_type === "relance_1" ? "reminder1_sent_at" : "reminder2_sent_at"]).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Date de relance prévue</Label>
                        <Input
                          type="date"
                          value={task.due_date}
                          onChange={e => {
                            const updated = [...editingTasks];
                            updated[idx] = { ...updated[idx], due_date: e.target.value };
                            setEditingTasks(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Note</Label>
                        <Input
                          value={task.note || ""}
                          onChange={e => {
                            const updated = [...editingTasks];
                            updated[idx] = { ...updated[idx], note: e.target.value };
                            setEditingTasks(updated);
                          }}
                          placeholder="Ajouter une note…"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {editingTasks.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={saveTaskEdits}>
                    <Save className="h-3 w-3" /> Sauvegarder les modifications
                  </Button>
                )}
              </div>

              {/* Email template editor */}
              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="font-medium text-sm">📧 Envoyer une relance</h3>
                
                {/* Toggle between Relance 1 and 2 */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReminderNum(1);
                      setReminderSubject(getReminderDefaultSubject(reminderProposal, 1));
                      setReminderBody(getReminderDefaultBody(reminderProposal, 1));
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${activeReminderNum === 1 ? "bg-amber-100 text-amber-700 font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    Relance 1
                  </button>
                  {(reminderProposal as any).proposal_type !== "info" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReminderNum(2);
                        setReminderSubject(getReminderDefaultSubject(reminderProposal, 2));
                        setReminderBody(getReminderDefaultBody(reminderProposal, 2));
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${activeReminderNum === 2 ? "bg-orange-100 text-orange-700 font-medium" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      Relance 2
                    </button>
                  )}
                </div>

                {/* Already sent warning */}
                {(reminderProposal as any)[activeReminderNum === 1 ? "reminder1_sent_at" : "reminder2_sent_at"] && (
                  <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded">
                    ✓ Déjà envoyée le {new Date((reminderProposal as any)[activeReminderNum === 1 ? "reminder1_sent_at" : "reminder2_sent_at"]).toLocaleDateString("fr-FR")}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Objet</Label>
                  <Input value={reminderSubject} onChange={e => setReminderSubject(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Corps du mail</Label>
                  <SimpleRichTextEditor value={reminderBody} onChange={setReminderBody} />
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={!!(reminderProposal as any)[activeReminderNum === 1 ? "reminder1_sent_at" : "reminder2_sent_at"] || sending === reminderProposal.id}
                  onClick={async () => {
                    await handleReminder(reminderProposal, activeReminderNum, reminderSubject, reminderBody);
                    const taskType = activeReminderNum === 1 ? "relance_1" : "relance_2";
                    const task = editingTasks.find((t: any) => t.task_type === taskType);
                    if (task) {
                      await supabase.from("proposal_tasks").update({ status: "completed", completed_at: new Date().toISOString() } as any).eq("id", task.id);
                      fetchTasks();
                    }
                    setReminderDialogOpen(false);
                  }}
                >
                  <Send className="h-4 w-4" />
                  {sending === reminderProposal.id ? "Envoi…" : `Envoyer Relance ${activeReminderNum}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info accept → new proposal dialog */}
      <Dialog open={infoAcceptDialogOpen} onOpenChange={setInfoAcceptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Convertir la demande d'infos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Cette demande d'informations a été acceptée. Quel type de proposition souhaitez-vous créer ?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleInfoAcceptConvert("classique")}
                className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-center space-y-2"
              >
                <div className="text-2xl">📋</div>
                <div className="text-sm font-medium">Proposition multiple</div>
                <div className="text-[10px] text-muted-foreground">Sélection de plusieurs conférenciers</div>
              </button>
              <button
                onClick={() => handleInfoAcceptConvert("unique")}
                className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-center space-y-2"
              >
                <div className="text-2xl">🎤</div>
                <div className="text-sm font-medium">Proposition unique</div>
                <div className="text-[10px] text-muted-foreground">Un seul conférencier proposé</div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// (AdminContractsContent moved to src/components/admin/AdminEventDossiers.tsx)

export default Admin;
