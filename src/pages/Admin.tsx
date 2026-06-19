import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Mic, Building2, FileText as FileTextIcon, ClipboardCheck, Mail as MailIcon, HelpCircle } from "lucide-react";
import nugget from "@/assets/nugget.png";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminSpeakersCRM from "@/components/admin/AdminSpeakersCRM";
import AdminSpeakerProfiles from "@/components/admin/AdminSpeakerProfiles";
import AdminLandingPages from "@/components/admin/AdminLandingPages";
import AdminClients from "@/components/admin/AdminClients";
import AdminEventDossiers from "@/components/admin/AdminEventDossiers";
import AdminEmailTemplates from "@/components/admin/AdminEmailTemplates";
import AdminFaq from "@/components/admin/AdminFaq";
import { loadEmailTemplates } from "@/lib/emailTemplates";

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authed, setAuthed] = useState(false);

  const tab = searchParams.get("tab") || "speakers";

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      setAuthed(true);
      // Charge les templates email pour le pré-remplissage des compositions
      loadEmailTemplates().catch(() => {});
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
              <ClipboardCheck className="h-4 w-4" /> Contrats
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Building2 className="h-4 w-4" /> Clients
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" /> Leads
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <MailIcon className="h-4 w-4" /> Emails
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" /> FAQ
            </TabsTrigger>
          </TabsList>


          <TabsContent value="speakers">
            <Tabs defaultValue="crm">
              <TabsList className="mb-4">
                <TabsTrigger value="crm">Fiches</TabsTrigger>
                <TabsTrigger value="profiles">Profils</TabsTrigger>
                <TabsTrigger value="landings">Landings</TabsTrigger>
              </TabsList>
              <TabsContent value="crm"><AdminSpeakersCRM /></TabsContent>
              <TabsContent value="profiles"><AdminSpeakerProfiles /></TabsContent>
              <TabsContent value="landings"><AdminLandingPages /></TabsContent>
            </Tabs>
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

          <TabsContent value="emails">
            <AdminEmailTemplates />
          </TabsContent>

          <TabsContent value="faq">
            <AdminFaq />
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
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Archive,
  User,
  ChevronDown,
  ChevronUp,
  Pencil,
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  EyeOff,
  Save,
  FileText,
  Bell,
  CalendarDays,
  Mail,
} from "lucide-react";
import EventDossier from "@/components/admin/EventDossier";
import { toast } from "sonner";
import { renderTpl } from "@/lib/emailTemplates";
import { EmailPreviewCard } from "@/components/admin/EmailPreviewCard";


const AGENT_VARS = {
  agent_nom: "Nelly Sabde",
  agent_telephone: "06 95 93 97 91",
  agent_email: "nellysabde@lesconferenciers.com",
};

const firstName = (s?: string) => (s ? s.split(" ")[0] : "");

const getDefaultMessage = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nSuite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.\n\nVous trouverez ci-joint un fichier PDF présentant une sélection de conférenciers, sous réserve de leur disponibilité.\n\nLes tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.\n\nJe reste bien entendu à votre disposition pour tout complément d'information. Et si aucun de ces profils ne correspondait pleinement à vos attentes, nous pourrions poursuivre ensemble les recherches afin d'identifier l'intervenant idéal.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers`;

const getFollowUpMessage = (recipientName: string, clientName: string) =>
  `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nSuite à notre récent échange, je suis ravie de vous adresser une nouvelle sélection de conférenciers qui, je l'espère, correspondra davantage à vos attentes.\n\nVous trouverez ci-joint un fichier PDF présentant cette nouvelle sélection, sous réserve de la disponibilité des intervenants.\n\nLes tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.\n\nJe reste bien entendu à votre disposition pour tout complément d'information. Et si aucun de ces profils ne correspondait pleinement à vos attentes, nous pourrions poursuivre ensemble les recherches afin d'identifier l'intervenant idéal.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers`;

const getDefaultEmailSubject = (clientName: string) => {
  const tpl = renderTpl("proposal_classic", { nom_client: clientName });
  if (tpl?.subject) return tpl.subject;
  return `Votre sélection de conférenciers sur mesure - ${clientName || "Les Conférenciers"}`;
};

const getFollowUpEmailSubject = (clientName: string) =>
  `Votre nouvelle sélection de conférenciers - ${clientName || "Les Conférenciers"}`;

const buildEventContextLine = (eventLocation: string, eventDateText: string, audienceSize: string) => {
  if (!eventLocation && !eventDateText && !audienceSize) return "";
  const parts: string[] = [];
  const formattedDate = formatFrenchEventDate(eventDateText);
  if (formattedDate) parts.push(`du <strong>${formattedDate}</strong>`);
  if (eventLocation) parts.push(`qui se tiendra à <strong>${eventLocation}</strong>`);
  if (audienceSize) parts.push(`devant un auditoire d'environ <strong>${audienceSize} personnes</strong>`);
  return `Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour votre événement ${parts.join(", ")}.`;
};

const TEMPLATE_EMAIL_PHRASES: Record<string, string> = {
  "Chefs d'orchestre":
    "une sélection de chefs d'orchestre et directeurs musicaux, conférenciers d'exception, soigneusement choisis",
  "GIGN / RAID": "une sélection de conférenciers issus des unités d'élite (GIGN, RAID), soigneusement choisis",
  "Patrouille de France":
    "une sélection de pilotes et anciens membres de la Patrouille de France, conférenciers d'exception, soigneusement choisis",
};

const getDefaultEmailBody = (
  recipientName: string,
  clientName: string,
  eventContext?: string,
  _templateName?: string,
) => {
  const tpl = renderTpl("proposal_classic", {
    prenom_destinataire: firstName(recipientName),
    nom_destinataire: recipientName,
    nom_client: clientName,
    event_context: eventContext || "",
    ...AGENT_VARS,
  });
  if (tpl?.body) return tpl.body;
  return `<p>Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},</p>

<p>Suite à votre mail et à notre conversation téléphonique, je suis ravie de vous accompagner dans votre recherche d'intervenants.</p>

${
  eventContext
    ? `<p>${eventContext}</p>

`
    : ""
}<p>Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.</p>

<p><strong>👉 Cliquez sur le bouton ci-dessous pour découvrir votre sélection.</strong></p>

<p>Je reste bien entendu à votre disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
};

const getFollowUpEmailBody = (
  recipientName: string,
  clientName: string,
  eventContext?: string,
  _templateName?: string,
  eventDateText?: string,
  eventLocation?: string,
  audienceSize?: string,
) => {
  const formattedDate = formatFrenchEventDate(eventDateText) || eventDateText || "";
  const tpl = renderTpl("proposal_update", {
    prenom_destinataire: firstName(recipientName),
    nom_destinataire: recipientName,
    nom_client: clientName,
    event_context: eventContext || "",
    date_evenement: formattedDate,
    lieu_evenement: eventLocation || "",
    auditoire: audienceSize || "",
    ...AGENT_VARS,
  });
  if (tpl?.body) return tpl.body;
  return `<p>Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},</p>

<p>Suite à notre récent échange, je suis ravie de vous adresser une <strong>nouvelle sélection de conférenciers</strong> qui, je l'espère, correspondra davantage à vos attentes.</p>

${
  eventContext
    ? `<p>${eventContext}</p>

`
    : ""
}<p>Les tarifs indiqués sont exprimés en HT et hors frais de voyage, d'hébergement et de restauration.</p>

<p><strong>👉 Cliquez sur le bouton ci-dessous pour découvrir votre nouvelle sélection.</strong></p>

<p>Je reste bien entendu à votre disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
};


const formatFrenchEventDate = (text?: string): string => {
  if (!text) return "";
  const trimmed = text.trim();
  // ISO YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const d = new Date(`${trimmed}T12:00:00`);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  // DD/MM/YYYY
  const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (fr) {
    const d = new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]), 12);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  return trimmed;
};

const getUniqueEmailBody = (
  recipientName: string,
  speakerName: string,
  totalAmount: string,
  speakerSlug: string,
  eventDateText?: string,
  eventLocation?: string,
  audienceSize?: string,
) => {
  const formattedDate = formatFrenchEventDate(eventDateText);
  const hasEventContext = formattedDate || eventLocation || audienceSize;
  const contextParts: string[] = [];
  if (formattedDate) contextParts.push(`du <strong>${formattedDate}</strong>`);
  if (eventLocation) contextParts.push(`qui aura lieu à <strong>${eventLocation}</strong>`);
  if (audienceSize) contextParts.push(`pour un auditoire d'environ <strong>${audienceSize} personnes</strong>`);

  const introPhrase = hasEventContext
    ? `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants concernant votre événement ${contextParts.join(", ")}, et vous adresse, comme convenu, le profil de ${speakerName}.`
    : `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants et vous adresse, comme convenu, le profil de ${speakerName}.`;

  const alternativePhrase = `<p>Si toutefois ce profil ne correspondait pas pleinement à vos attentes, je serais heureuse de vous proposer d'autres intervenants adaptés à vos critères.</p>

<p><strong>👉 À ce titre, pourriez-vous m'indiquer la taille de l'auditoire envisagé ainsi que l'enveloppe budgétaire disponible ?</strong></p>`;

  const profileUrl = `https://www.lesconferenciers.com/conferencier/${speakerSlug}`;
  const tpl = renderTpl("proposal_unique", {
    prenom_destinataire: firstName(recipientName),
    nom_destinataire: recipientName,
    conferencier: speakerName,
    tarif_conferencier: totalAmount,
    url_proposition: profileUrl,
    event_context: hasEventContext ? `concernant votre événement ${contextParts.join(", ")}` : "",
    date_evenement: formattedDate,
    lieu_evenement: eventLocation || "",
    auditoire: audienceSize || "",
    ...AGENT_VARS,
  });
  if (tpl?.body) return tpl.body;

  return `<p>Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},</p>

<p>Je fais suite à votre mail et à ma tentative de vous joindre par téléphone.</p>

<p>${introPhrase} Le tarif de son intervention est de ${totalAmount} € HT, hors frais VHR.</p>

<p><strong>👉 <a href="${profileUrl}" target="_blank" rel="noopener noreferrer">Découvrir le profil de ${speakerName}</a></strong> (sous réserve de sa disponibilité)</p>

${alternativePhrase}

<p>Je reste bien entendu à votre entière disposition pour tout complément d'information.</p>

<p>Dans l'attente de votre retour, je vous souhaite une très belle journée.</p>

<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
};

const getInfoEmailBody = (recipientName: string) => {
  const tpl = renderTpl("proposal_info", {
    prenom_destinataire: firstName(recipientName),
    nom_destinataire: recipientName,
    ...AGENT_VARS,
  });
  if (tpl?.body) return tpl.body;
  return `Bonjour${recipientName ? ` ${recipientName.split(" ")[0]}` : ""},\n\nMerci pour votre message. J'ai tenté de vous joindre par téléphone sans succès et me permets donc de revenir vers vous par écrit.\n\nJe serais ravie de vous accompagner dans votre recherche d'intervenants. Afin de pouvoir vous proposer des profils parfaitement adaptés à vos besoins, pourriez-vous m'apporter quelques précisions concernant :\n\n• La taille de l'auditoire\n• Le profil des participants (commerciaux, managers, experts, etc.)\n• La durée souhaitée pour l'intervention\n• La thématique à aborder\n\nConcernant votre enveloppe budgétaire : le tarif moyen des conférenciers se situe entre 4K et 7K HT, hors frais VHR. L'idéal serait de nous indiquer si votre budget se situe dans cette fourchette, au-dessus ou en-dessous, sachant que les premiers tarifs de notre offre se situent autour de 2,5K HT, hors frais VHR.\n\nCes informations me permettront de cibler au mieux les conférenciers à vous suggérer.\n\nJe reste bien entendu à votre disposition pour en discuter de vive voix si vous le souhaitez.\n\nDans l'attente de votre retour, je vous souhaite une très belle journée.\n\nNelly Sabde - Les Conférenciers\n📞 06 95 93 97 91`;
};

type ProposalType = "classique" | "unique" | "info";

type SpeakerConference = { id: string; title: string; speaker_id: string };
type Speaker = {
  id: string;
  name: string;
  image_url: string | null;
  role: string | null;
  themes: string[] | null;
  base_fee: number | null;
  fee_details: string | null;
  city: string | null;
  formal_address?: boolean;
  email?: string | null;
  phone?: string | null;
  slug?: string;
};
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
    speakers: {
      name: string;
      image_url: string | null;
      formal_address?: boolean;
      email?: string | null;
      phone?: string | null;
    } | null;
  }[];
};

const DEFAULT_COMMISSION = 0;

/** Speaker selector with search and alphabetical sort by last name */
const SpeakerSelector = ({
  speakers,
  selectedSpeakers,
  onSelect,
}: {
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
    .filter((s) => !selectedSpeakers.find((ps) => ps.speaker_id === s.id))
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name), "fr"));

  return (
    <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
      <Label className="text-xs text-muted-foreground block">Ajouter un conférencier</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom…"
          className="pl-8 text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto border border-input rounded-md">
        {available.map((s) => (
          <button
            key={s.id}
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2 border-b border-border last:border-0"
            onClick={() => {
              onSelect(s);
              setSearch("");
            }}
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
const parseAlternativeRates = (
  feeDetails: string | null | undefined,
  baseFee: number | null,
): { label: string; value: number }[] => {
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
    const after = fullText.substring(
      match.index + match[0].length,
      Math.min(fullText.length, match.index + match[0].length + 80),
    );

    // Build label from context
    let label = "";
    // Look for context after the number (e.g., "en anglais", "hors période...", "en province")
    const afterContext = after
      .replace(/^[\s€euroskK.,]+/, "")
      .split(/[.;]|\bet\b|\d/)[0]
      .trim();
    // Look for context before (e.g., "Visio")
    const beforeContext =
      before
        .split(/[.;,]/)
        .pop()
        ?.trim()
        .replace(/^(et|ou)\s+/i, "") || "";

    if (beforeContext && !beforeContext.match(/^\d/) && beforeContext.length > 1 && beforeContext.length < 40) {
      label = `${num.toLocaleString("fr-FR")} € — ${beforeContext}${afterContext ? " " + afterContext : ""}`;
    } else if (afterContext && afterContext.length > 1 && afterContext.length < 60) {
      label = `${num.toLocaleString("fr-FR")} € — ${afterContext}`;
    } else {
      label = `${num.toLocaleString("fr-FR")} €`;
    }

    // Avoid duplicates
    if (!rates.find((r) => Math.abs(r.value - num) < 1)) {
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
const getProposalSpeakerTotal = (
  speaker?: Pick<ProposalSpeaker, "total_price" | "speaker_fee" | "travel_costs" | "agency_commission"> | null,
) =>
  speaker?.total_price ??
  (speaker?.speaker_fee || 0) + (speaker?.travel_costs || 0) + (speaker?.agency_commission || 0);
// toEmailBodyHtml now lives in @/components/admin/EmailPreviewCard (shared)


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

// EmailPreviewCard is imported from "@/components/admin/EmailPreviewCard"
// (source unique de vérité pour l'aperçu des emails, partagé avec l'onglet Emails).


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
  const [internalNotes, setInternalNotes] = useState("");
  const [editInternalNotes, setEditInternalNotes] = useState("");
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
  const [templates, setTemplates] = useState<{ id: string; name: string; speaker_ids: string[]; is_preset: boolean }[]>(
    [],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [emailExistsWarning, setEmailExistsWarning] = useState<string | null>(null);
  const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
  const [showLeadsPanel, setShowLeadsPanel] = useState(false);
  const [proposalSearch, setProposalSearch] = useState("");
  const [pageSize, setPageSize] = useState<10 | 50 | 100>(10);
  const [ccEmails, setCcEmails] = useState("");
  const [hideTestProposals, setHideTestProposals] = useState(true);
  const [proposalTasks, setProposalTasks] = useState<any[]>([]);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderProposal, setReminderProposal] = useState<Proposal | null>(null);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const [simpleReminderDate, setSimpleReminderDate] = useState<string>("");
  const [simpleReminderNote, setSimpleReminderNote] = useState<string>("");
  const [simpleFollowupDate, setSimpleFollowupDate] = useState<string>("");
  const [simpleFollowupNote, setSimpleFollowupNote] = useState<string>("");

  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderBody, setReminderBody] = useState("");
  const [activeReminderNum, setActiveReminderNum] = useState<1 | 2>(1);
  const [infoAcceptDialogOpen, setInfoAcceptDialogOpen] = useState(false);
  const [infoAcceptProposalId, setInfoAcceptProposalId] = useState<string | null>(null);
  const [updatingFromProposalId, setUpdatingFromProposalId] = useState<string | null>(null);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [leadsDialogProposal, setLeadsDialogProposal] = useState<Proposal | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [expandedArchivedGroupId, setExpandedArchivedGroupId] = useState<string | null>(null);
  const [linkDialog, setLinkDialog] = useState<{
    candidate: { id: string; created_at: string; recipient_name: string | null; client_name: string };
    andSend: boolean;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetchProposals(),
      fetchSpeakers(),
      fetchConferences(),
      fetchClients(),
      fetchTemplates(),
      fetchTasks(),
      fetchLeads(),
    ]);
  }, []);

  // Pre-fill proposal dialog from a lead draft (handed off via sessionStorage by AdminLeads)
  const [draftConsumed, setDraftConsumed] = useState(false);
  useEffect(() => {
    if (draftConsumed) return;
    const raw = sessionStorage.getItem("pendingProposalDraft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      resetForm();
      setProposalType("classique");
      setClientName(draft.clientName || "");
      setClientEmail(draft.clientEmail || "");
      setRecipientName(draft.recipientName || "");
      setClientPhone(draft.clientPhone || "");
      setEventLocation(draft.eventLocation || "");
      setEventDateText(draft.eventDateText || "");
      setAudienceSize(draft.audienceSize || "");
      if (draft.message) setMessage(draft.message);
      setEmailSubject(getDefaultEmailSubject(draft.clientName || ""));
      setEmailBody(getDefaultEmailBody(draft.recipientName || "", draft.clientName || ""));
      if (draft.clientId) {
        setSelectedClientId(draft.clientId);
        setClientMode("search");
      } else {
        setClientMode("new");
      }
      setDialogOpen(true);
      sessionStorage.removeItem("pendingProposalDraft");
      setDraftConsumed(true);
    } catch (e) {
      sessionStorage.removeItem("pendingProposalDraft");
      setDraftConsumed(true);
    }
  }, [draftConsumed]);

  const fetchLeads = async () => {
    const { data } = await supabase.from("simulator_leads").select("*").order("created_at", { ascending: false });
    setAllLeads((data as any) || []);
  };

  const getMatchingLeads = (email: string) => {
    if (!email) return [];
    const norm = email.trim().toLowerCase();
    return allLeads.filter((l) => (l.email || "").trim().toLowerCase() === norm);
  };

  // Auto-update email body when event details change
  useEffect(() => {
    if (proposalType === "unique") {
      const ps = selectedSpeakers[0];
      if (!ps) return;
      const speaker = speakers.find((s) => s.id === ps.speaker_id);
      if (!speaker) return;
      setEmailBody(
        getUniqueEmailBody(
          recipientName,
          speaker.name,
          getProposalSpeakerTotal(ps).toLocaleString("fr-FR"),
          speaker.slug || "",
          eventDateText,
          eventLocation,
          audienceSize,
        ),
      );
    } else if (proposalType === "classique") {
      const evtCtx = buildEventContextLine(eventLocation, eventDateText, audienceSize);
      const tpl = selectedTemplateId ? templates.find((t) => t.id === selectedTemplateId) : null;
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
      const existingProposals = proposals.filter((p) => p.client_email?.toLowerCase() === clientEmail.toLowerCase());
      if (existingProposals.length > 0) {
        const latest = existingProposals[0];
        const dateStr = new Date(latest.created_at).toLocaleDateString("fr-FR");
        warnings.push(`${existingProposals.length} proposition(s) (dernière : ${dateStr}, statut : ${latest.status})`);
      }
      const existingClient = allClients.find((c) => c.email?.toLowerCase() === clientEmail.toLowerCase());
      if (existingClient) {
        warnings.push(
          `client existant : ${existingClient.company_name}${existingClient.contact_name ? ` (${existingClient.contact_name})` : ""}`,
        );
      }
      if (warnings.length > 0) {
        setEmailExistsWarning(`⚠️ Email déjà connu — ${warnings.join(" • ")}`);
      } else {
        setEmailExistsWarning(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientEmail, proposals, allClients]);

  // Load leads matching the client email — to consult their original message while drafting/editing the proposal.
  // Also auto-prefill event details (date, location, audience size) from the most recent lead, when those fields are empty.
  useEffect(() => {
    const targetEmail = editDialogOpen ? editClientEmail : clientEmail;
    if (!targetEmail || targetEmail.length < 5 || !targetEmail.includes("@")) {
      setMatchingLeads([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("simulator_leads")
        .select("*")
        .ilike("email", targetEmail.trim())
        .order("created_at", { ascending: false });
      const leads = (data as any[]) || [];
      setMatchingLeads(leads);

      // Auto-prefill from latest lead (only when creating, and only empty fields, no existing client selected)
      if (!editDialogOpen && leads.length > 0 && !selectedClientId) {
        const latest = leads[0];
        if (latest.event_date && !eventDateText)
          setEventDateText(formatFrenchEventDate(latest.event_date) || latest.event_date);
        if (latest.location && !eventLocation) setEventLocation(latest.location);
        if (latest.audience_size && !audienceSize) setAudienceSize(latest.audience_size);
        if (latest.company && !clientName) setClientName(latest.company);
        const fullName = `${latest.first_name || ""} ${latest.last_name || ""}`.trim();
        if (fullName && !recipientName) setRecipientName(fullName);
        if (latest.phone && !clientPhone) setClientPhone(latest.phone);
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientEmail, editClientEmail, editDialogOpen]);

  const fetchProposals = async () => {
    setLoading(true);
    const [proposalsRes, contractsRes, invoicesRes] = await Promise.all([
      supabase
        .from("proposals")
        .select(
          "*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, display_order, selected_conference_ids, speakers(name, image_url, formal_address, email, phone))",
        )
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
    const { data } = await supabase
      .from("speakers")
      .select("id, name, image_url, role, themes, base_fee, fee_details, city, formal_address, email, phone, slug")
      .order("name");
    setSpeakers(data || []);
  };

  const fetchConferences = async () => {
    const { data } = await supabase.from("speaker_conferences").select("id, title, speaker_id").order("display_order");
    setConferences(data || []);
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name, contact_name, email, phone, status")
      .order("company_name");
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

  const createTasksForProposal = async (
    proposalId: string,
    sentAt: string,
    pType?: string,
    seedNote?: string | null,
  ) => {
    const sentDate = new Date(sentAt);
    const relance1Date = new Date(sentDate);
    relance1Date.setDate(relance1Date.getDate() + 7);

    const note = seedNote && seedNote.trim() ? seedNote.trim() : null;
    const tasks: any[] = [
      { proposal_id: proposalId, task_type: "relance_1", due_date: relance1Date.toISOString().split("T")[0], note },
      // Relance 2 sans date par défaut (admin la planifie manuellement) — y compris pour "info".
      { proposal_id: proposalId, task_type: "relance_2", due_date: null, note },
    ];

    await supabase.from("proposal_tasks").insert(tasks as any);
    fetchTasks();
  };

  // Annule toutes les tâches "pending" des propositions sœurs (même client_email)
  // pour éviter que des relances obsolètes remontent dans le rappel quotidien
  // lorsqu'une proposition plus récente coexiste pour le même client.
  const cancelSiblingPendingTasks = async (currentProposalId: string, clientEmail?: string | null) => {
    if (!clientEmail) return;
    const email = clientEmail.trim().toLowerCase();
    if (!email) return;
    const siblingProposalIds = proposals
      .filter(
        (p) =>
          p.id !== currentProposalId &&
          (p.client_email || "").trim().toLowerCase() === email &&
          (p.status === "sent" || p.status === "accepted" || p.status === "archived"),
      )
      .map((p) => p.id);
    if (siblingProposalIds.length === 0) return;
    await supabase
      .from("proposal_tasks")
      .update({ status: "cancelled", completed_at: new Date().toISOString() } as any)
      .in("proposal_id", siblingProposalIds)
      .eq("status", "pending");
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
<p>Très belle fin de journée à vous.</p>
<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
      }
      return `<p>Bonjour,</p>
<p>Je reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants. 🙂</p>
<p>Je souhaitais savoir si l'intervention de ${speakerName} était toujours d'actualité.</p>
<p>Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.</p>
<p>Dans l'attente de votre retour, je vous souhaite une très belle fin de journée.</p>
<p>Bien à vous,</p>
<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
    }

    if (pType === "info") {
      // Only relance 1 for info type
      return `<p>Bonjour,</p>
<p>Je reviens vers vous suite à nos précédents échanges.</p>
<p>Avez-vous pu en prendre connaissance ?</p>
<p>Votre recherche d’intervenant est-elle toujours d’actualité ?</p>
<p>Vous remerciant par avance de votre retour et restant à votre écoute, je vous souhaite une excellente journée.</p>
<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
    }

    // classique
    if (num === 1) {
      return `<p>Bonjour${firstName ? ` ${firstName}` : ""},</p>
<p>J'espère que vous allez bien !</p>
<p>Je me permets de revenir vers vous suite à nos précédents échanges concernant votre recherche d'intervenants 🙂</p>
<p>Je souhaitais savoir si un des profils avait retenu particulièrement votre attention ou si vous souhaitiez éventuellement que nous continuions les recherches.</p>
<p>Je reste bien évidemment à votre disposition si besoin est.</p>
<p>Dans l'attente de votre retour.</p>
<p>Très belle fin de journée à vous.</p>
<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
    }
    return `<p>Bonjour${firstName ? ` ${firstName}` : ""},</p>
<p>Je reviens vers vous suite à nos précédents échanges concernant votre recherche d'intervenants 🙂</p>
<p>Je souhaitais savoir si vous aviez pu avancer dans votre réflexion quant au choix de l'intervenant qui correspondrait le mieux à vos besoins.</p>
<p>Je reste bien entendu à votre entière disposition pour échanger ou répondre à vos questions.</p>
<p>Dans l'attente de votre retour, je vous souhaite une très belle fin de journée.</p>
<p>Nelly Sabde - Les Conférenciers<br>📞 06 95 93 97 91</p>`;
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
    setSimpleReminderDate(((p as any).next_reminder_date as string) || "");
    setSimpleReminderNote(
      ((p as any).next_reminder_note as string) || (p as any).internal_notes || "",
    );
    setSimpleFollowupDate(((p as any).followup_reminder_date as string) || "");
    setSimpleFollowupNote(((p as any).followup_reminder_note as string) || "");
    setActiveReminderNum(1);
    setReminderSubject(getReminderDefaultSubject(p, 1));
    setReminderBody(getReminderDefaultBody(p, 1));
    setReminderDialogOpen(true);
  };

  const saveTaskEdits = async () => {
    if (!reminderProposal) return;
    const noteToSync =
      (simpleReminderNote && simpleReminderNote.trim()) ||
      (simpleFollowupNote && simpleFollowupNote.trim()) ||
      null;
    await supabase
      .from("proposals")
      .update({
        next_reminder_date: simpleReminderDate || null,
        next_reminder_note: simpleReminderNote || null,
        followup_reminder_date: simpleFollowupDate || null,
        followup_reminder_note: simpleFollowupNote || null,
        internal_notes: noteToSync,
      } as any)
      .eq("id", reminderProposal.id);
    toast.success("Relance mise à jour");
    await cancelSiblingPendingTasks(reminderProposal.id, reminderProposal.client_email);
    fetchTasks();
    fetchProposals();
  };



  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const newSpeakers: ProposalSpeaker[] = tpl.speaker_ids
      .map((sid, idx) => {
        const sp = speakers.find((s) => s.id === sid);
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
    const pInvoices = allInvoices.filter((i) => i.proposal_id === p.id);
    const pContract = contracts.find((c) => c.proposal_id === p.id);
    const allPaid = pInvoices.length > 0 && pInvoices.every((i) => i.status === "paid");
    const somePaid = pInvoices.some((i) => i.status === "paid");
    const hasAcompteSent = pInvoices.some(
      (i) => i.invoice_type === "acompte" && (i.status === "sent" || i.status === "paid"),
    );
    const hasAcompte = pInvoices.some((i) => i.invoice_type === "acompte");
    if (allPaid && pInvoices.length > 0) return "fully_paid";
    if (somePaid) return "partial_paid";
    if (hasAcompteSent) return "acompte_sent";
    if (hasAcompte) return "acompte_created";
    if (pContract) return "contrat_sent";
    return "accepted";
  };

  const isFullyPaid = (p: Proposal) => getPipelineStatus(p) === "fully_paid";

  const applyTypeFilter = (items: Proposal[]) =>
    typeFilter === "all" ? items : items.filter((p) => (p as any).proposal_type === typeFilter);
  const applyDateSort = (items: Proposal[]) =>
    dateSortAsc
      ? [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : items;
  const isTestProposal = (p: Proposal) =>
    p.client_name.toLowerCase().includes("test quotidien") || p.client_email.toLowerCase().includes("test quotidien");
  const applyHideTest = (items: Proposal[]) => (hideTestProposals ? items.filter((p) => !isTestProposal(p)) : items);
  const testProposalCount = proposals.filter(isTestProposal).length;
  const applySearch = (items: Proposal[]) => {
    const q = proposalSearch.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) => {
      const speakerNames = (p.proposal_speakers || [])
        .map((ps: any) => ps.speakers?.name || "")
        .join(" ")
        .toLowerCase();
      return (
        p.client_name.toLowerCase().includes(q) ||
        p.client_email.toLowerCase().includes(q) ||
        (p.recipient_name || "").toLowerCase().includes(q) ||
        speakerNames.includes(q)
      );
    });
  };
  const filterAndSort = (items: Proposal[]) => applyDateSort(applyTypeFilter(applySearch(applyHideTest(items))));

  // Les ancêtres d'une chaîne de mise à jour (archivés mais référencés par une autre proposition)
  // remontent dans l'onglet Envoyées et sont exclus de l'onglet Archivées.
  const supersededIds = new Set(
    proposals.map((p: any) => p.previous_proposal_id).filter(Boolean) as string[],
  );
  const drafts = filterAndSort(proposals.filter((p) => p.status === "draft"));
  const sent = filterAndSort(
    proposals.filter((p) => p.status === "sent" || (p.status === "archived" && supersededIds.has(p.id))),
  );
  const accepted = filterAndSort(proposals.filter((p) => p.status === "accepted"));
  const archived = filterAndSort(
    proposals.filter((p) => p.status === "archived" && !supersededIds.has(p.id)),
  );

  const getConferencesForSpeaker = (speakerId: string) => conferences.filter((c) => c.speaker_id === speakerId);

  const createProposalSpeaker = (speaker: Speaker, displayOrder: number): ProposalSpeaker => {
    const baseFee = speaker.base_fee ?? 0;
    return {
      speaker_id: speaker.id,
      speaker_fee: baseFee || null,
      travel_costs: 0,
      agency_commission: globalCommission,
      total_price: baseFee + globalCommission || null,
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
        })),
    );

  const addSpeakerToList = (items: ProposalSpeaker[], speaker: Speaker) => {
    if (items.find((s) => s.speaker_id === speaker.id)) {
      toast.error("Déjà ajouté");
      return items;
    }

    return [...items, createProposalSpeaker(speaker, items.length)];
  };

  const removeSpeakerFromList = (items: ProposalSpeaker[], speakerId: string) =>
    normalizeSpeakerOrder(items.filter((s) => s.speaker_id !== speakerId));

  const moveSpeakerInList = (items: ProposalSpeaker[], index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return items;

    const nextItems = [...items];
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    return normalizeSpeakerOrder(nextItems);
  };

  const toggleConferenceInList = (items: ProposalSpeaker[], speakerId: string, confId: string) =>
    items.map((s) => {
      if (s.speaker_id !== speakerId) return s;
      const ids = s.selected_conference_ids.includes(confId)
        ? s.selected_conference_ids.filter((id) => id !== confId)
        : [...s.selected_conference_ids, confId];
      return { ...s, selected_conference_ids: ids };
    });

  const updateSpeakerFieldInList = (
    items: ProposalSpeaker[],
    speakerId: string,
    field: keyof ProposalSpeaker,
    value: number | null,
  ) =>
    items.map((s) => {
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
      toast.error("Un seul conférencier pour ce type");
      return;
    }
    const nextSpeakers = addSpeakerToList(selectedSpeakers, speaker);
    setSelectedSpeakers(nextSpeakers);
    if (proposalType === "unique") {
      const total = getProposalSpeakerTotal(nextSpeakers[0]);
      setEmailBody(
        getUniqueEmailBody(
          recipientName,
          speaker.name,
          total.toLocaleString("fr-FR"),
          speaker.slug || "",
          eventDateText,
          eventLocation,
          audienceSize,
        ),
      );
    }
  };

  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakers((prev) => {
      const next = removeSpeakerFromList(prev, speakerId);
      if (proposalType === "unique") setEmailBody("");
      return next;
    });
  };

  const toggleConference = (speakerId: string, confId: string) => {
    setSelectedSpeakers((prev) => toggleConferenceInList(prev, speakerId, confId));
  };

  const updateSpeakerField = (speakerId: string, field: keyof ProposalSpeaker, value: number | null) => {
    setSelectedSpeakers((prev) => {
      const next = updateSpeakerFieldInList(prev, speakerId, field, value);
      if (proposalType === "unique" && next[0]) {
        const speaker = speakers.find((s) => s.id === next[0].speaker_id);
        setEmailBody(
          getUniqueEmailBody(
            recipientName,
            speaker?.name || "",
            getProposalSpeakerTotal(next[0]).toLocaleString("fr-FR"),
            speaker?.slug || "",
            eventDateText,
            eventLocation,
            audienceSize,
          ),
        );
      }
      return next;
    });
  };

  const getSpeakerName = (id: string) => speakers.find((s) => s.id === id)?.name || "—";
  const getSpeakerImage = (id: string) => speakers.find((s) => s.id === id)?.image_url || null;
  const getSpeakerCity = (id: string) => speakers.find((s) => s.id === id)?.city || null;

  const handleCreate = async (andSend = false) => {
    if (!clientName || !clientEmail) {
      toast.error("Remplissez le nom et l'email du client");
      return;
    }
    if (proposalType === "classique" && selectedSpeakers.length === 0) {
      toast.error("Ajoutez au moins 1 conférencier");
      return;
    }
    if (proposalType === "unique" && selectedSpeakers.length === 0) {
      toast.error("Sélectionnez un conférencier");
      return;
    }

    // Détection automatique : si une proposition envoyée existe déjà pour cet email
    // (et que l'utilisateur n'est pas déjà en mode "mise à jour"), proposer de la
    // remplacer comme nouvelle version pour qu'elle bascule en archivée.
    if (!updatingFromProposalId) {
      const { data: candidates } = await supabase
        .from("proposals")
        .select("id, created_at, recipient_name, client_name, previous_proposal_id")
        .eq("client_email", clientEmail)
        .eq("status", "sent")
        .order("created_at", { ascending: false });
      const list = (candidates || []) as any[];
      const successorOf = new Set(list.map((c) => c.previous_proposal_id).filter(Boolean));
      const active = list.filter((c) => !successorOf.has(c.id));
      if (active.length > 0) {
        setLinkDialog({
          candidate: {
            id: active[0].id,
            created_at: active[0].created_at,
            recipient_name: active[0].recipient_name,
            client_name: active[0].client_name,
          },
          andSend,
        });
        return;
      }
    }

    await doCreate(andSend, updatingFromProposalId);
  };

  const doCreate = async (andSend: boolean, linkId: string | null) => {
    setSubmitting(true);

    // Auto-create or link client
    let clientId = selectedClientId;
    if (!clientId) {
      const { data: existingClients } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("email", clientEmail)
        .limit(1);
      if (existingClients && existingClients.length > 0) {
        if (clientMode === "new") {
          toast.error(
            `Ce client existe déjà en base : "${existingClients[0].company_name}". Utilisez la recherche pour le sélectionner.`,
          );
          setSubmitting(false);
          return;
        }
        clientId = existingClients[0].id;
      } else {
        const { data: newClient } = await supabase
          .from("clients")
          .insert({
            company_name: clientName,
            contact_name: recipientName || null,
            email: clientEmail,
            phone: clientPhone || null,
            status: "prospect",
          })
          .select("id")
          .single();
        if (newClient) clientId = newClient.id;
      }
    }

    const eventContext = buildEventContextLine(eventLocation, eventDateText, audienceSize);
    const finalMessage =
      proposalType === "classique" ? emailBody || getDefaultEmailBody(recipientName, clientName, eventContext) : "";
    const finalSubject = emailSubject || getDefaultEmailSubject(clientName);
    let finalBody = emailBody;
    if (!finalBody) {
      if (proposalType === "unique" && selectedSpeakers.length > 0) {
        const sp = speakers.find((s) => s.id === selectedSpeakers[0].speaker_id);
        finalBody = getUniqueEmailBody(
          recipientName,
          sp?.name || "",
          getProposalSpeakerTotal(selectedSpeakers[0]).toLocaleString("fr-FR"),
          (sp as any)?.slug || "",
          eventDateText,
          eventLocation,
          audienceSize,
        );
      } else if (proposalType === "info") {
        finalBody = getInfoEmailBody(recipientName);
      } else {
        finalBody = getDefaultEmailBody(recipientName, clientName, eventContext);
      }
    }
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert({
        client_name: clientName,
        client_email: clientEmail,
        message: finalMessage,
        recipient_name: recipientName || null,
        email_subject: finalSubject,
        email_body: finalBody,
        proposal_type: proposalType,
        client_id: clientId,
        event_location: eventLocation || null,
        event_date_text: eventDateText || null,
        audience_size: audienceSize || null,
        client_phone: clientPhone || null,
        previous_proposal_id: linkId || null,
        internal_notes: internalNotes.trim() || null,
      } as any)
      .select()
      .single();
    if (error || !proposal) {
      toast.error("Erreur création");
      setSubmitting(false);
      return;
    }
    if (selectedSpeakers.length > 0) {
      const { error: spError } = await supabase.from("proposal_speakers").insert(
        selectedSpeakers.map((s, i) => ({
          proposal_id: proposal.id,
          speaker_id: s.speaker_id,
          speaker_fee: s.speaker_fee,
          travel_costs: s.travel_costs,
          agency_commission: s.agency_commission,
          total_price: s.total_price,
          display_order: i,
          selected_conference_ids: s.selected_conference_ids.length > 0 ? s.selected_conference_ids : null,
        })),
      );
      if (spError) {
        toast.error("Erreur ajout speakers");
        setSubmitting(false);
        return;
      }
    }
    if (andSend) {
      try {
        const ccList = ccEmails
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.includes("@"));
        const { error: sendErr } = await supabase.functions.invoke("send-proposal-email", {
          body: { proposal_id: proposal.id, cc: ccList.length > 0 ? ccList : undefined },
        });
        if (sendErr) throw sendErr;
        const sentAt = new Date().toISOString();
        await supabase.from("proposals").update({ status: "sent", sent_at: sentAt }).eq("id", proposal.id);
        await createTasksForProposal(proposal.id, sentAt, proposalType, internalNotes.trim() || null);

        // Mise à jour d'une proposition précédente : copier notes + supprimer tâches pending.
        // L'ancienne reste en statut "sent" et apparaît dans l'onglet Envoyées (regroupée par client).
        if (linkId) {
          const { data: prevTasks } = await supabase
            .from("proposal_tasks")
            .select("task_type, note")
            .eq("proposal_id", linkId);
          const notesToCopy = (prevTasks || []).filter((t: any) => t.note && t.note.trim());
          if (notesToCopy.length > 0) {
            for (const t of notesToCopy as any[]) {
              await supabase
                .from("proposal_tasks")
                .update({ note: t.note })
                .eq("proposal_id", proposal.id)
                .eq("task_type", t.task_type);
            }
          }
          // Supprime les relances en attente sur l'ancienne version pour ne plus rappeler l'agenda dessus.
          await supabase
            .from("proposal_tasks")
            .delete()
            .eq("proposal_id", linkId)
            .eq("status", "pending");
          // Archive l'ancienne : elle reste visible dans l'onglet Envoyées (groupée) mais toute action est verrouillée.
          await supabase
            .from("proposals")
            .update({
              status: "archived",
              lost_reason: "[Mise à jour] Remplacée par une nouvelle proposition",
              lost_at: new Date().toISOString(),
            } as any)
            .eq("id", linkId);
        }
        toast.success(
          linkId ? "Proposition mise à jour et renvoyée !" : "Proposition créée et envoyée !",
        );
      } catch {
        toast.error("Proposition créée mais erreur d'envoi");
      }
    } else {
      toast.success("Brouillon enregistré !");
    }
    setDialogOpen(false);
    resetForm();
    fetchProposals();
    fetchClients();
    fetchTasks();
    setSubmitting(false);
  };


  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setRecipientName("");
    setSelectedSpeakers([]);
    setEmailSubject("");
    setEmailBody("");
    setMessage(getDefaultMessage("", ""));
    setProposalType("classique");
    setGlobalCommission(0);
    setClientPhone("");
    setEventLocation("");
    setEventDateText("");
    setAudienceSize("");
    setClientSearchQuery("");
    setClientSearchResults([]);
    setSelectedClientId(null);
    setClientMode("new");
    setCcEmails("");
    setUpdatingFromProposalId(null);
    setInternalNotes("");
  };

  const handleNewProposalForClient = (clientId: string, latest: Proposal) => {
    const client = allClients.find((c) => c.id === clientId);
    resetForm();
    const pType = ((latest as any).proposal_type || "classique") as ProposalType;
    setProposalType(pType);
    setClientMode("search");
    setSelectedClientId(clientId);
    const cName = client?.company_name || latest.client_name || "";
    const cEmail = client?.email || latest.client_email || "";
    const cPhone = client?.phone || (latest as any).client_phone || "";
    const rName = client?.contact_name || latest.recipient_name || "";
    setClientName(cName);
    setClientEmail(cEmail);
    setClientPhone(cPhone);
    setRecipientName(rName);
    const rawDate = (latest as any).event_date_text || "";
    const dateFmt = formatFrenchEventDate(rawDate) || rawDate;
    setEventLocation((latest as any).event_location || "");
    setEventDateText(dateFmt);
    setAudienceSize((latest as any).audience_size || "");
    // Pré-remplir les conférenciers depuis la proposition source (point de départ modifiable)
    setSelectedSpeakers(buildProposalSpeakers(latest.proposal_speakers));
    // Lier comme "mise à jour" : la précédente sera archivée à l'envoi
    setUpdatingFromProposalId(latest.id);
    const ctx = buildEventContextLine(
      (latest as any).event_location || "",
      dateFmt,
      (latest as any).audience_size || "",
    );
    setMessage(getFollowUpMessage(rName, cName));
    setEmailSubject(getFollowUpEmailSubject(cName));
    setEmailBody(getFollowUpEmailBody(rName, cName, ctx, undefined, dateFmt, (latest as any).event_location || "", (latest as any).audience_size || ""));
    // Reporter les notes internes de la version précédente (avec fallback sur la note de relance_1)
    (async () => {
      const previousNotes = ((latest as any).internal_notes || "").trim();
      if (previousNotes) {
        setInternalNotes(previousNotes);
      } else {
        const { data: prevTasks } = await supabase
          .from("proposal_tasks")
          .select("note, task_type")
          .eq("proposal_id", latest.id);
        const r1 = (prevTasks || []).find((t: any) => t.task_type === "relance_1");
        const r2 = (prevTasks || []).find((t: any) => t.task_type === "relance_2");
        const fallback = (r1?.note && r1.note.trim()) || (r2?.note && r2.note.trim()) || "";
        if (fallback) setInternalNotes(fallback);
      }
    })();
    setDialogOpen(true);
  };

  const openEditDialog = (p: Proposal) => {
    setEditingProposal(p);
    setEditClientName(p.client_name);
    setEditClientEmail(p.client_email);
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
      setEditEmailBody(
        p.email_body ||
          getUniqueEmailBody(
            p.recipient_name || "",
            speaker?.name || "",
            getProposalSpeakerTotal(uniqueSpeaker).toLocaleString("fr-FR"),
            speaker?.slug || "",
            (p as any).event_date_text,
            (p as any).event_location,
            (p as any).audience_size,
          ),
      );
    } else {
      setEditMessage(p.message || getDefaultMessage(p.recipient_name || "", p.client_name));
      setEditEmailSubject(p.email_subject || getDefaultEmailSubject(p.client_name));
      setEditEmailBody(p.email_body || getDefaultEmailBody(p.recipient_name || "", p.client_name));
    }
    setEditSelectedSpeakers(proposalSpeakers);
    setEditInternalNotes(((p as any).internal_notes || "") as string);
    setShowLeadsPanel(true);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (andSend = false) => {
    if (!editingProposal) return;
    const pType = (editingProposal.proposal_type || "classique") as ProposalType;
    if (!editClientName || !editClientEmail) {
      toast.error("Remplissez le nom et email");
      return;
    }
    if (pType === "classique" && editSelectedSpeakers.length === 0) {
      toast.error("Ajoutez au moins 1 conférencier");
      return;
    }
    if (pType === "unique" && editSelectedSpeakers.length === 0) {
      toast.error("Sélectionnez un conférencier");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("proposals")
      .update({
        client_name: editClientName,
        client_email: editClientEmail,
        recipient_name: editRecipientName || null,
        message: pType === "classique" ? editEmailBody || null : null,
        email_subject: editEmailSubject || null,
        email_body: editEmailBody || null,
        internal_notes: editInternalNotes.trim() || null,
      } as any)
      .eq("id", editingProposal.id);
    if (error) {
      toast.error("Erreur");
      setSubmitting(false);
      return;
    }

    if (pType !== "info") {
      const { error: deleteError } = await supabase
        .from("proposal_speakers")
        .delete()
        .eq("proposal_id", editingProposal.id);
      if (deleteError) {
        toast.error("Erreur sur les conférenciers");
        setSubmitting(false);
        return;
      }

      if (editSelectedSpeakers.length > 0) {
        const { error: insertError } = await supabase.from("proposal_speakers").insert(
          editSelectedSpeakers.map((speaker, index) => ({
            proposal_id: editingProposal.id,
            speaker_id: speaker.speaker_id,
            speaker_fee: speaker.speaker_fee,
            travel_costs: speaker.travel_costs,
            agency_commission: speaker.agency_commission,
            total_price: speaker.total_price,
            display_order: index,
            selected_conference_ids:
              speaker.selected_conference_ids.length > 0 ? speaker.selected_conference_ids : null,
          })),
        );
        if (insertError) {
          toast.error("Erreur sur les tarifs des conférenciers");
          setSubmitting(false);
          return;
        }
      }
    }

    if (andSend) {
      try {
        const { error: sendErr } = await supabase.functions.invoke("send-proposal-email", {
          body: { proposal_id: editingProposal.id },
        });
        if (sendErr) throw sendErr;
        const sentAt = new Date().toISOString();
        await supabase.from("proposals").update({ status: "sent", sent_at: sentAt }).eq("id", editingProposal.id);
        // Create tasks if not yet existing
        const existingTasks = getTasksForProposal(editingProposal.id);
        if (existingTasks.length === 0)
          await createTasksForProposal(
            editingProposal.id,
            sentAt,
            (editingProposal as any).proposal_type,
            editInternalNotes.trim() || null,
          );
        toast.success("Proposition sauvegardée et envoyée !");
      } catch {
        toast.error("Sauvegardée mais erreur d'envoi");
      }
    } else {
      toast.success("Brouillon mis à jour !");
    }
    setEditDialogOpen(false);
    setEditingProposal(null);
    setEditSelectedSpeakers([]);
    fetchProposals();
    setSubmitting(false);
  };

  const handleSend = async (proposal: Proposal) => {
    setSending(proposal.id);
    try {
      const { error } = await supabase.functions.invoke("send-proposal-email", { body: { proposal_id: proposal.id } });
      if (error) throw error;
      const sentAt = new Date().toISOString();
      await supabase.from("proposals").update({ status: "sent", sent_at: sentAt }).eq("id", proposal.id);
      await createTasksForProposal(proposal.id, sentAt, (proposal as any).proposal_type);
      await cancelSiblingPendingTasks(proposal.id, proposal.client_email);
      toast.success("Email envoyé !");
      fetchProposals();
    } catch {
      toast.error("Erreur d'envoi");
    }
    setSending(null);
  };

  const handleReminder = async (
    proposal: Proposal,
    reminderNum: 1 | 2,
    customSubject?: string,
    customBody?: string,
  ) => {
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
      await supabase
        .from("proposals")
        .update({ [field]: new Date().toISOString() } as any)
        .eq("id", proposal.id);
      await cancelSiblingPendingTasks(proposal.id, proposal.client_email);
      toast.success(`Relance ${reminderNum} envoyée !`);
      fetchProposals();
    } catch {
      toast.error("Erreur d'envoi de relance");
    }
    setSending(null);
  };

  const handleAccept = async (id: string) => {
    const proposal = proposals.find((p) => p.id === id);
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
    const original = proposals.find((p) => p.id === infoAcceptProposalId);
    if (!original) return;
    // Pre-fill a new proposal creation form with the client + event info
    resetForm();
    setClientName(original.client_name);
    setClientEmail(original.client_email);
    setRecipientName(original.recipient_name || "");
    setClientPhone((original as any).client_phone || "");
    // Pré-remplir les détails de l'événement
    const rawDate = (original as any).event_date_text || "";
    const dateFmt = formatFrenchEventDate(rawDate) || rawDate;
    setEventLocation((original as any).event_location || "");
    setEventDateText(dateFmt);
    setAudienceSize((original as any).audience_size || "");
    setProposalType(newType);
    // Set email defaults
    if (newType === "classique") {
      setEmailSubject(getDefaultEmailSubject(original.client_name));
      setEmailBody(getDefaultEmailBody(original.recipient_name || "", original.client_name));
    }
    // Préselection du client si déjà rattaché
    if ((original as any).client_id) {
      setClientMode("search");
      setSelectedClientId((original as any).client_id);
    } else {
      setClientMode("new");
    }
    // Lier comme mise à jour (la demande d'infos sera archivée à l'envoi via handleCreate)
    setUpdatingFromProposalId(infoAcceptProposalId);
    setInfoAcceptDialogOpen(false);
    setDialogOpen(true);
    toast.info("Complétez la proposition à partir des informations du client");
  };

  // ── Archivage avec raison obligatoire ──
  const [archiveDialogId, setArchiveDialogId] = useState<string | null>(null);
  const [archiveReasonCategory, setArchiveReasonCategory] = useState<string>("autre");
  const [archiveReasonText, setArchiveReasonText] = useState<string>("");
  const [archiveSubmitting, setArchiveSubmitting] = useState(false);

  const handleArchive = (id: string) => {
    setArchiveReasonCategory("autre");
    setArchiveReasonText("");
    setArchiveDialogId(id);
  };

  const submitArchive = async () => {
    if (!archiveDialogId) return;
    if (!archiveReasonText.trim() && archiveReasonCategory === "autre") {
      toast.error("Merci d'indiquer la raison de l'archivage.");
      return;
    }
    setArchiveSubmitting(true);
    const labelMap: Record<string, string> = { prix: "Prix", date: "Date", profil: "Profil", autre: "Autre" };
    const finalReason =
      `[${labelMap[archiveReasonCategory] || archiveReasonCategory}] ${archiveReasonText.trim()}`.trim();
    const { error } = await supabase
      .from("proposals")
      .update({
        status: "archived",
        lost_reason: finalReason,
        lost_at: new Date().toISOString(),
      } as any)
      .eq("id", archiveDialogId);
    setArchiveSubmitting(false);
    if (error) {
      toast.error("Erreur d'archivage");
      return;
    }
    toast.success("Proposition archivée");
    setArchiveDialogId(null);
    fetchProposals();
  };

  // (handleNewProposalForClient existant — voir plus haut, conservé)

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette proposition ?")) return;
    await supabase.from("proposal_speakers").delete().eq("proposal_id", id);
    await supabase.from("proposals").delete().eq("id", id);
    toast.success("Proposition supprimée");
    fetchProposals();
  };

  // Marquer un brouillon comme envoyé manuellement (sans envoi de mail)
  const handleMarkAsSent = async (proposal: Proposal) => {
    if (!confirm("Marquer cette proposition comme envoyée (sans envoi d'email) ?")) return;
    const sentAt = new Date().toISOString();
    const { error } = await supabase
      .from("proposals")
      .update({ status: "sent", sent_at: sentAt })
      .eq("id", proposal.id);
    if (error) {
      toast.error("Erreur");
      return;
    }
    await createTasksForProposal(proposal.id, sentAt, (proposal as any).proposal_type);
    toast.success("Proposition marquée comme envoyée");
    fetchProposals();
  };

  // Détails d'une proposition archivée (lecture seule)
  const [archiveDetailsId, setArchiveDetailsId] = useState<string | null>(null);

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
      const ctx = buildEventContextLine(eventLocation, eventDateText, audienceSize);
      setEmailBody(getDefaultEmailBody(recipientName, clientName, ctx));
      setMessage(getDefaultMessage(recipientName, clientName));
      setEmailSubject(getDefaultEmailSubject(clientName));
    }
  };

  const applyGlobalCommission = (val: number) => {
    setGlobalCommission(val);
    setSelectedSpeakers((prev) => {
      const updated = prev.map((s) => {
        const u = { ...s, agency_commission: val };
        u.total_price = (u.speaker_fee || 0) + (u.travel_costs || 0) + val || null;
        return u;
      });
      if (proposalType === "unique" && updated[0]) {
        const speaker = speakers.find((sp) => sp.id === updated[0].speaker_id);
        setEmailBody(
          getUniqueEmailBody(
            recipientName,
            speaker?.name || "",
            getProposalSpeakerTotal(updated[0]).toLocaleString("fr-FR"),
            speaker?.slug || "",
            eventDateText,
            eventLocation,
            audienceSize,
          ),
        );
      }
      return updated;
    });
  };

  const selectExistingClient = async (client: any) => {
    setSelectedClientId(client.id);
    setClientName(client.company_name);
    setClientEmail(client.email || "");
    setRecipientName(client.contact_name || "");
    setClientPhone(client.phone || "");
    setClientMode("search");
    // Préremplir les détails événement depuis la dernière proposition de ce client
    try {
      const { data: latest } = await supabase
        .from("proposals")
        .select("event_location, event_date_text, audience_size")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) {
        const loc = (latest as any).event_location || "";
        const rawDate = (latest as any).event_date_text || "";
        const dateFmt = formatFrenchEventDate(rawDate) || rawDate;
        const aud = (latest as any).audience_size || "";
        if (loc && !eventLocation) setEventLocation(loc);
        if (dateFmt && !eventDateText) setEventDateText(dateFmt);
        if (aud && !audienceSize) setAudienceSize(aud);
        // Regénérer sujet + corps du mail avec contexte
        const ctx = buildEventContextLine(loc, dateFmt, aud);
        const rName = client.contact_name || "";
        const cName = client.company_name || "";
        setEmailSubject(getDefaultEmailSubject(cName));
        setEmailBody(getDefaultEmailBody(rName, cName, ctx));
      }
    } catch (e) {
      console.warn("Prefill last proposal failed", e);
    }
  };

  const filteredClients = clientSearchQuery.trim()
    ? allClients.filter(
        (c) =>
          c.company_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
          c.contact_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(clientSearchQuery.toLowerCase()),
      )
    : [];

  const eventContext = buildEventContextLine(eventLocation, eventDateText, audienceSize);

  const renderSpeakerForm = () => (
    <div className="space-y-6 mt-4">
      {/* Proposal type selector */}
      <div className="space-y-2">
        <Label>Type de proposition</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "classique" as ProposalType, label: "📋 Classique", desc: "Multi-conférenciers avec lien web" },
            {
              value: "unique" as ProposalType,
              label: "🎤 Conférencier unique",
              desc: "Un seul profil, tout dans l'email",
            },
            { value: "info" as ProposalType, label: "📝 Demande d'infos", desc: "Email simple sans conférencier" },
          ].map((opt) => (
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
              onChange={(e) => {
                if (e.target.value) applyTemplate(e.target.value);
                else {
                  setSelectedTemplateId(null);
                }
              }}
            >
              <option value="">— Sélection libre —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.speaker_ids.length} conférenciers)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Client search/create section */}
      <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
        <Label className="text-sm font-medium">👤 Client</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setClientMode("new");
              setSelectedClientId(null);
            }}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${clientMode === "new" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Nouveau client
          </button>
          <button
            type="button"
            onClick={() => {
              setClientMode("search");
              setSelectedClientId(null);
            }}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${clientMode === "search" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Rechercher un client existant
          </button>
        </div>

        {clientMode === "search" && !selectedClientId && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, contact ou email…"
                className="pl-8 text-sm"
              />
            </div>
            {clientSearchQuery.trim() && (
              <div className="max-h-40 overflow-y-auto border border-input rounded-md">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectExistingClient(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between border-b border-border last:border-0"
                  >
                    <div>
                      <span className="font-medium">{c.company_name}</span>
                      {c.contact_name && <span className="text-muted-foreground ml-2">({c.contact_name})</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                    Aucun résultat —{" "}
                    <button type="button" onClick={() => setClientMode("new")} className="text-primary underline">
                      créer un nouveau client
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedClientId && clientMode === "search" && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{clientName}</span>
            <span className="text-xs text-muted-foreground">{clientEmail}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedClientId(null);
                setClientName("");
                setClientEmail("");
                setRecipientName("");
                setClientPhone("");
              }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Changer
            </button>
          </div>
        )}

        {(clientMode === "new" || selectedClientId) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Société / Nom du client</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="SNCF"
                  disabled={!!selectedClientId}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email du client</Label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="email@societe.com"
                  disabled={!!selectedClientId}
                />
              </div>
            </div>
            {emailExistsWarning && (
              <div className="bg-amber-50 border border-amber-300 rounded-md px-3 py-1.5 text-xs text-amber-800">
                {emailExistsWarning}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Prénom Nom du destinataire</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Pascal DUPONT"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Téléphone client</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event details - hidden for info type */}
      {proposalType !== "info" && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <Label className="text-sm font-medium">📍 Détails de l'événement (optionnel)</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date de l'événement</Label>
              <Input
                value={eventDateText}
                onChange={(e) => setEventDateText(e.target.value)}
                placeholder="15 mars 2026"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lieu d'intervention</Label>
              <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Paris" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Taille de l'auditoire</Label>
              <Input value={audienceSize} onChange={(e) => setAudienceSize(e.target.value)} placeholder="200" />
            </div>
          </div>
          {(eventDateText || eventLocation || audienceSize) &&
            (() => {
              const contextParts: string[] = [];
              if (proposalType === "unique") {
                if (eventDateText) contextParts.push(`du <strong>${eventDateText}</strong>`);
                if (eventLocation) contextParts.push(`qui aura lieu à <strong>${eventLocation}</strong>`);
                if (audienceSize)
                  contextParts.push(`pour un auditoire d'environ <strong>${audienceSize} personnes</strong>`);
              } else {
                if (eventDateText) contextParts.push(`du <strong>${eventDateText}</strong>`);
                if (eventLocation) contextParts.push(`qui se tiendra à <strong>${eventLocation}</strong>`);
                if (audienceSize)
                  contextParts.push(`devant un auditoire d'environ <strong>${audienceSize} personnes</strong>`);
              }
              const previewText =
                proposalType === "unique"
                  ? `Je suis ravie de pouvoir vous accompagner dans votre recherche d'intervenants concernant votre événement ${contextParts.join(", ")}...`
                  : `Vous trouverez ci-joint une sélection de conférenciers (sous réserve de leur disponibilité) pour votre événement ${contextParts.join(", ")}.`;
              return (
                <div
                  className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-xs text-foreground italic"
                  dangerouslySetInnerHTML={{ __html: previewText }}
                />
              );
            })()}
        </div>
      )}

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
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : 0;
                applyGlobalCommission(val);
              }}
              onWheel={noScrollWheel}
              placeholder="0"
              className="max-w-xs"
            />
          </div>

          <div className="space-y-3">
            <Label>
              Conférenciers ({selectedSpeakers.length}
              {proposalType === "unique" ? "/1" : ""})
            </Label>
            {selectedSpeakers.map((ps, idx) => {
              const city = getSpeakerCity(ps.speaker_id);
              const imageUrl = getSpeakerImage(ps.speaker_id);
              const speakerConfs = getConferencesForSpeaker(ps.speaker_id);
              return (
                <div key={ps.speaker_id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={getSpeakerName(ps.speaker_id)}
                            className="h-full w-full object-cover"
                          />
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => {
                          setSelectedSpeakers((prev) => {
                            const arr = [...prev];
                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                            return arr;
                          });
                        }}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === selectedSpeakers.length - 1}
                        onClick={() => {
                          setSelectedSpeakers((prev) => {
                            const arr = [...prev];
                            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                            return arr;
                          });
                        }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeSpeaker(ps.speaker_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {speakerConfs.length > 0 && (
                    <div className="space-y-2 bg-muted/50 rounded-md p-3">
                      <Label className="text-xs text-muted-foreground">Conférences à inclure</Label>
                      {speakerConfs.map((conf) => (
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
                      {(() => {
                        const sp = speakers.find((s) => s.id === ps.speaker_id);
                        const feeDetails = sp?.fee_details;
                        const altRates = parseAlternativeRates(feeDetails, sp?.base_fee ?? null);
                        return (
                          <div className="space-y-1">
                            {sp?.base_fee && (
                              <div className="text-xs font-medium text-accent mb-1">
                                Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €
                              </div>
                            )}
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={ps.speaker_fee ?? ""}
                              onChange={(e) =>
                                updateSpeakerField(
                                  ps.speaker_id,
                                  "speaker_fee",
                                  e.target.value ? Number(e.target.value) : null,
                                )
                              }
                              onWheel={noScrollWheel}
                            />
                            {altRates.length > 0 && (
                              <select
                                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                value={ps.speaker_fee?.toString() || ""}
                                onChange={(e) => {
                                  if (e.target.value)
                                    updateSpeakerField(ps.speaker_id, "speaker_fee", Number(e.target.value));
                                }}
                              >
                                {sp?.base_fee && (
                                  <option value={sp.base_fee.toString()}>
                                    Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €
                                  </option>
                                )}
                                {altRates.map((r, i) => (
                                  <option key={i} value={r.value}>
                                    {r.label}
                                  </option>
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
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={ps.travel_costs ?? ""}
                        onChange={(e) =>
                          updateSpeakerField(
                            ps.speaker_id,
                            "travel_costs",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        onWheel={noScrollWheel}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Commission agence (€)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={ps.agency_commission ?? ""}
                        onChange={(e) =>
                          updateSpeakerField(
                            ps.speaker_id,
                            "agency_commission",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        onWheel={noScrollWheel}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Prix total HT (€)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={ps.total_price ?? ""}
                        onChange={(e) =>
                          updateSpeakerField(
                            ps.speaker_id,
                            "total_price",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        onWheel={noScrollWheel}
                        className="font-bold"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {(proposalType === "classique" || (proposalType === "unique" && selectedSpeakers.length === 0)) && (
              <SpeakerSelector speakers={speakers} selectedSpeakers={selectedSpeakers} onSelect={addSpeaker} />
            )}
          </div>
        </>
      )}

      {/* Email section - AFTER speakers */}
      <div className="space-y-2">
        <Label>✉️ Email d'envoi - Objet</Label>
        <Input
          value={emailSubject || getResolvedEmailSubject(proposalType, "", clientName)}
          onChange={(e) => setEmailSubject(e.target.value)}
          placeholder="Objet de l'email"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Adresses en copie (CC)</Label>
        <Input
          value={ccEmails}
          onChange={(e) => setCcEmails(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
        />
        <p className="text-[10px] text-muted-foreground">
          Séparez les adresses par des virgules. Ces adresses ne seront pas ajoutées au CRM.
        </p>
      </div>
      <div className={cn("grid gap-3", matchingLeads.length > 0 && showLeadsPanel ? "lg:grid-cols-[1fr_320px]" : "")}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>✉️ Email d'envoi - Corps</Label>
            {matchingLeads.length > 0 && (
              <button
                type="button"
                onClick={() => setShowLeadsPanel((v) => !v)}
                className="text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                {showLeadsPanel ? "Masquer" : `📨 Afficher les messages reçus (${matchingLeads.length})`}
              </button>
            )}
          </div>
          <SimpleRichTextEditor
            value={
              emailBody ||
              getResolvedEmailBody({
                type: proposalType,
                body: "",
                recipientName,
                clientName,
                selectedSpeakers,
                speakers,
                eventContext,
              })
            }
            onChange={setEmailBody}
            placeholder="Corps de l'email..."
            rows={8}
          />
        </div>
        {matchingLeads.length > 0 && showLeadsPanel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">📨 Messages reçus ({matchingLeads.length})</Label>
              <button
                type="button"
                onClick={() => setShowLeadsPanel(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Masquer
              </button>
            </div>
            <div className="border border-border rounded-md bg-muted/20 max-h-[360px] overflow-y-auto divide-y divide-border">
              {matchingLeads.map((lead) => {
                const date = new Date(lead.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
                return (
                  <div key={lead.id} className="p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{fullName || "Sans nom"}</span>
                      <span className="text-[10px] text-muted-foreground">{date}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2">
                      <span className="bg-background px-1.5 rounded">{lead.lead_type}</span>
                      {lead.company && <span>🏢 {lead.company}</span>}
                      {lead.phone && <span>📞 {lead.phone}</span>}
                    </div>
                    {(lead.event_type || lead.event_date || lead.audience_size || lead.budget) && (
                      <div className="text-[10px] text-muted-foreground">
                        {lead.event_type && <span>📅 {lead.event_type}</span>}
                        {lead.event_date && <span> · {lead.event_date}</span>}
                        {lead.audience_size && <span> · 👥 {lead.audience_size}</span>}
                        {lead.budget && <span> · 💶 {lead.budget}</span>}
                      </div>
                    )}
                    {lead.themes?.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">🎯 {lead.themes.join(", ")}</div>
                    )}
                    {lead.objective && <div className="text-foreground/80 italic">« {lead.objective} »</div>}
                    {lead.additional_info && (
                      <div className="bg-background border border-border rounded p-1.5 mt-1 whitespace-pre-wrap text-foreground/90">
                        {lead.additional_info}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowCreatePreview(!showCreatePreview)}
        >
          {showCreatePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showCreatePreview ? "Masquer l'aperçu" : "Aperçu réel de l'email envoyé"}
        </Button>
        {showCreatePreview && (
          <EmailPreviewCard
            to={clientEmail}
            subject={getResolvedEmailSubject(proposalType, emailSubject, clientName)}
            body={getResolvedEmailBody({
              type: proposalType,
              body: emailBody,
              recipientName,
              clientName,
              selectedSpeakers,
              speakers,
              eventContext,
              eventDateText,
              eventLocation,
              audienceSize,
            })}
            showProposalButton={proposalType === "classique"}
          />
        )}
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <Label className="text-sm font-medium">🗒️ Notes internes (relances et suivi)</Label>
        <p className="text-[11px] text-muted-foreground">
          Visible uniquement en interne. Sauvegardée dès le brouillon et reportée automatiquement aux prochaines
          versions de cette proposition.
        </p>
        <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} />
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === 0}
                  onClick={() => setItems((prev) => moveSpeakerInList(prev, idx, "up"))}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === items.length - 1}
                  onClick={() => setItems((prev) => moveSpeakerInList(prev, idx, "down"))}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItems((prev) => removeSpeakerFromList(prev, ps.speaker_id))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {speakerConfs.length > 0 && (
              <div className="space-y-2 bg-muted/50 rounded-md p-3">
                <Label className="text-xs text-muted-foreground">Conférences à inclure</Label>
                {speakerConfs.map((conf) => (
                  <div key={conf.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-conf-${conf.id}-${ps.speaker_id}`}
                      checked={ps.selected_conference_ids.includes(conf.id)}
                      onCheckedChange={() => setItems((prev) => toggleConferenceInList(prev, ps.speaker_id, conf.id))}
                    />
                    <label
                      htmlFor={`edit-conf-${conf.id}-${ps.speaker_id}`}
                      className="text-sm cursor-pointer leading-tight"
                    >
                      {conf.title}
                    </label>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cachet conférencier (€)</Label>
                {(() => {
                  const sp = speakers.find((s) => s.id === ps.speaker_id);
                  const feeDetails = sp?.fee_details;
                  const altRates = parseAlternativeRates(feeDetails, sp?.base_fee ?? null);
                  return (
                    <div className="space-y-1">
                      {sp?.base_fee && (
                        <div className="text-xs font-medium text-accent mb-1">
                          Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €
                        </div>
                      )}
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={ps.speaker_fee ?? ""}
                        onChange={(e) =>
                          setItems((prev) =>
                            updateSpeakerFieldInList(
                              prev,
                              ps.speaker_id,
                              "speaker_fee",
                              e.target.value ? Number(e.target.value) : null,
                            ),
                          )
                        }
                        onWheel={noScrollWheel}
                      />
                      {altRates.length > 0 && (
                        <select
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                          value={ps.speaker_fee?.toString() || ""}
                          onChange={(e) => {
                            if (e.target.value)
                              setItems((prev) =>
                                updateSpeakerFieldInList(prev, ps.speaker_id, "speaker_fee", Number(e.target.value)),
                              );
                          }}
                        >
                          {sp?.base_fee && (
                            <option value={sp.base_fee.toString()}>
                              Cachet de base : {sp.base_fee.toLocaleString("fr-FR")} €
                            </option>
                          )}
                          {altRates.map((r, i) => (
                            <option key={i} value={r.value}>
                              {r.label}
                            </option>
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
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Frais déplacement (€)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={ps.travel_costs ?? ""}
                  onChange={(e) =>
                    setItems((prev) =>
                      updateSpeakerFieldInList(
                        prev,
                        ps.speaker_id,
                        "travel_costs",
                        e.target.value ? Number(e.target.value) : null,
                      ),
                    )
                  }
                  onWheel={noScrollWheel}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Commission agence (€)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={ps.agency_commission ?? ""}
                  onChange={(e) =>
                    setItems((prev) =>
                      updateSpeakerFieldInList(
                        prev,
                        ps.speaker_id,
                        "agency_commission",
                        e.target.value ? Number(e.target.value) : null,
                      ),
                    )
                  }
                  onWheel={noScrollWheel}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prix total HT (€)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={ps.total_price ?? ""}
                  onChange={(e) =>
                    setItems((prev) =>
                      updateSpeakerFieldInList(
                        prev,
                        ps.speaker_id,
                        "total_price",
                        e.target.value ? Number(e.target.value) : null,
                      ),
                    )
                  }
                  onWheel={noScrollWheel}
                  className="font-bold"
                />
              </div>
            </div>
          </div>
        );
      })}
      <SpeakerSelector
        speakers={speakers}
        selectedSpeakers={items}
        onSelect={(speaker) => setItems((prev) => addSpeakerToList(prev, speaker))}
      />
    </div>
  );

  const renderProposalRow = (p: Proposal, mode: "draft" | "sent" | "completed") => {
    const remaining = getRemainingDays(p.expires_at);
    const expired = isExpired(p.expires_at);
    const pipelineStatus = p.status === "accepted" ? getPipelineStatus(p) : null;
    const pipelineInfo = pipelineStatus ? getPipelineLabel(pipelineStatus) : null;
    const isSuperseded = supersededIds.has(p.id);

    return (
      <React.Fragment key={p.id}>
        <TableRow className={expired && mode !== "completed" ? "opacity-50" : ""}>
          <TableCell className="text-xs whitespace-nowrap">{formatDate(p.created_at)}</TableCell>
          <TableCell>
            <div className="font-medium text-sm flex items-center gap-1.5">
              {p.client_name}
              {(() => {
                let v = 1;
                let cur: any = p;
                const byId = new Map(proposals.map((x: any) => [x.id, x]));
                while (cur?.previous_proposal_id && byId.has(cur.previous_proposal_id)) {
                  v++;
                  cur = byId.get(cur.previous_proposal_id);
                }
                if (v > 1)
                  return (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold"
                      title="Proposition mise à jour"
                    >
                      v{v}
                    </span>
                  );
                return null;
              })()}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{p.client_email}</span>
              {(() => {
                const matches = getMatchingLeads(p.client_email);
                if (matches.length === 0) return null;
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadsDialogProposal(p);
                    }}
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
                          {speaker.image_url ? (
                            <img src={speaker.image_url} alt={speaker.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-foreground whitespace-nowrap">{speaker.name}</span>
                        {i < visible.length - 1 && <span className="text-muted-foreground text-xs">·</span>}
                      </div>
                    );
                  })}
                  {remaining > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                      title={speakersList
                        .slice(maxVisible)
                        .map((ps: any) => ps.speakers?.name)
                        .filter(Boolean)
                        .join(", ")}
                    >
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
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                (p as any).proposal_type === "unique"
                  ? "bg-violet-100 text-violet-700"
                  : (p as any).proposal_type === "info"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {(p as any).proposal_type === "unique"
                ? "🎤 Unique"
                : (p as any).proposal_type === "info"
                  ? "📝 Infos"
                  : "📋 Classique"}
            </span>
          </TableCell>
          <TableCell>
            {mode === "draft" && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Brouillon</span>
            )}
            {mode === "sent" && p.status === "sent" && !isSuperseded && (
              <div className="space-y-1">
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">En attente</span>
                {!expired && <div className="text-[10px] text-muted-foreground">{remaining}j restants</div>}
                {expired && <span className="text-[10px] text-destructive font-medium">Expiré</span>}
                {(p as any).reminder1_sent_at && <div className="text-[10px] text-blue-600">Relance 1 ✓</div>}
                {(p as any).reminder2_sent_at && <div className="text-[10px] text-blue-600">Relance 2 ✓</div>}
                {(() => {
                  const tasks = getTasksForProposal(p.id);
                  const pendingTasks = tasks.filter((t: any) => t.status === "pending" && t.due_date);
                  if (pendingTasks.length === 0) return null;
                  const nextTask = pendingTasks.sort((a: any, b: any) =>
                    (a.due_date || "").localeCompare(b.due_date || ""),
                  )[0];
                  const dueDate = new Date(nextTask.due_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isOverdue = dueDate < today;
                  const isToday = dueDate.toDateString() === today.toDateString();
                  return (
                    <div
                      className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : isToday ? "text-amber-600 font-medium" : "text-muted-foreground"}`}
                    >
                      <CalendarDays className="h-3 w-3" />
                      {nextTask.task_type === "relance_1" ? "R1" : "R2"}:{" "}
                      {dueDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
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
            {mode === "sent" && (p.status === "archived" || isSuperseded) && (() => {
              let v = 1;
              let cur: any = p;
              const byId = new Map(proposals.map((x: any) => [x.id, x]));
              while (cur?.previous_proposal_id && byId.has(cur.previous_proposal_id)) {
                v++;
                cur = byId.get(cur.previous_proposal_id);
              }
              const label = "Archivée";
              return (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {label}{v > 1 ? ` v${v}` : ""}
                </span>
              );
            })()}
            {mode === "completed" && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">✓ Mission terminée</span>
            )}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1 flex-wrap">
              {p.status === "accepted" && (mode === "sent" || mode === "completed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  title="Dossier événement"
                >
                  {expandedId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
              {mode === "sent" && (p.status === "archived" || isSuperseded) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArchiveDetailsId(p.id)}
                  title="Voir détails"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {!isSuperseded && (
                <Button variant="ghost" size="sm" onClick={() => copyLink(p)} title="Copier le lien">
                  {copiedId === p.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
              {!isSuperseded && (
                <Button variant="ghost" size="sm" asChild title="Voir en ligne">
                  <a href={getProposalUrl(p.token)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {!isSuperseded && p.status !== "draft" && (p as any).proposal_type !== "info" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const printWindow = window.open(getProposalUrl(p.token) + "?print=true", "_blank");
                    if (printWindow) {
                      printWindow.addEventListener("afterprint", () => printWindow.close());
                    }
                  }}
                  title="Télécharger en PDF"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              {!isSuperseded && (mode === "draft" || (mode === "sent" && p.status === "sent")) && (
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)} title="Éditer">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {mode === "draft" && (
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
              )}
              {mode === "draft" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleMarkAsSent(p)}
                  title="Marquer comme envoyée (sans envoi d'email)"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {mode === "sent" && p.status === "sent" && !isSuperseded && (
                <>
                  {!expired && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => openReminderDialog(p)}
                      title="Relances"
                    >
                      <Bell className="h-3 w-3" /> Relances
                    </Button>
                  )}
                  {(p as any).proposal_type !== "info" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleAccept(p.id)}
                      title="Accepter"
                    >
                      <Check className="h-3 w-3" /> Accepter
                    </Button>
                  )}
                </>
              )}
              {(p as any).proposal_type === "info" &&
                (mode === "draft" || (mode === "sent" && (p.status === "sent" || p.status === "draft"))) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => {
                      setInfoAcceptProposalId(p.id);
                      setInfoAcceptDialogOpen(true);
                    }}
                    title="Convertir en proposition"
                  >
                    <Send className="h-3 w-3" /> Convertir
                  </Button>
                )}
              {mode === "sent" && p.status === "sent" && !isSuperseded && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-violet-600 border-violet-200 hover:bg-violet-50"
                  onClick={() => handleNewProposalForClient(p.client_id || "", p)}
                  title="Mettre à jour & renvoyer une nouvelle proposition"
                >
                  <RefreshCw className="h-3 w-3" /> Mettre à jour
                </Button>
              )}
              {mode !== "completed" && p.status !== "archived" && !isSuperseded && (
                <Button variant="ghost" size="sm" onClick={() => handleArchive(p.id)} title="Archiver">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
              {mode === "draft" && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} title="Supprimer">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
        {expandedId === p.id && p.status === "accepted" && (
          <TableRow>
            <TableCell colSpan={6} className="bg-muted/30 px-6 py-2">
              <EventDossier
                proposal={{
                  id: p.id,
                  client_name: p.client_name,
                  client_email: p.client_email,
                  recipient_name: p.recipient_name,
                  client_id: p.client_id || null,
                  status: p.status,
                  proposal_type: (p as any).proposal_type || "classique",
                  event_date_text: (p as any).event_date_text || null,
                  event_location: (p as any).event_location || null,
                  audience_size: (p as any).audience_size || null,
                  proposal_speakers: (p.proposal_speakers || []).map((ps: any) => ({
                    speaker_id: ps.speaker_id,
                    speaker_fee: ps.speaker_fee,
                    travel_costs: ps.travel_costs,
                    agency_commission: ps.agency_commission,
                    total_price: ps.total_price,
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
          {items.map((p) => renderProposalRow(p, p.status === "draft" ? "draft" : "sent"))}
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

  // Build groups for "Envoyées" tab: group by client_id, keep orphans (no client_id) as singles.
  type SentEntry =
    | { kind: "group"; clientId: string; label: string; sublabel?: string; items: Proposal[]; latest: Proposal }
    | { kind: "single"; proposal: Proposal };

  const buildSentEntries = (items: Proposal[]): SentEntry[] => {
    const groupsMap = new Map<string, Proposal[]>();
    const singles: Proposal[] = [];
    for (const p of items) {
      if (p.client_id) {
        const arr = groupsMap.get(p.client_id) || [];
        arr.push(p);
        groupsMap.set(p.client_id, arr);
      } else {
        singles.push(p);
      }
    }
    const entries: SentEntry[] = [];
    for (const [clientId, props] of groupsMap.entries()) {
      const sorted = [...props].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const client = allClients.find((c) => c.id === clientId);
      const label = client?.company_name || sorted[0].client_name;
      const sublabel = client?.contact_name || sorted[0].recipient_name || sorted[0].client_email;
      if (props.length === 1) {
        entries.push({ kind: "single", proposal: sorted[0] });
      } else {
        entries.push({
          kind: "group",
          clientId,
          label,
          sublabel: sublabel || undefined,
          items: sorted,
          latest: sorted[0],
        });
      }
    }
    for (const p of singles) entries.push({ kind: "single", proposal: p });
    // Sort by most recent date (respecting dateSortAsc)
    entries.sort((a, b) => {
      const da =
        a.kind === "group" ? new Date(a.latest.created_at).getTime() : new Date(a.proposal.created_at).getTime();
      const db =
        b.kind === "group" ? new Date(b.latest.created_at).getTime() : new Date(b.proposal.created_at).getTime();
      return dateSortAsc ? da - db : db - da;
    });
    return entries;
  };

  const renderGroupedSentTable = (entries: SentEntry[]) => (
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
          {entries.map((entry) => {
            if (entry.kind === "single") return renderProposalRow(entry.proposal, "sent");
            const isOpen = expandedGroupId === entry.clientId;
            const hasAccepted = entry.items.some((p) => p.status === "accepted");
            const latest = entry.latest;
            return (
              <React.Fragment key={`group-${entry.clientId}`}>
                <TableRow
                  className="bg-muted/40 hover:bg-muted/60 cursor-pointer"
                  onClick={() => setExpandedGroupId(isOpen ? null : entry.clientId)}
                >
                  <TableCell className="text-xs whitespace-nowrap font-medium">
                    <div className="flex items-center gap-1.5">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {formatDate(latest.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {entry.label}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {entry.items.length} propositions
                      </span>
                    </div>
                    {entry.sublabel && <div className="text-xs text-muted-foreground">{entry.sublabel}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground italic">— historique groupé —</TableCell>
                  <TableCell>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {(latest as any).proposal_type === "unique"
                        ? "🎤"
                        : (latest as any).proposal_type === "info"
                          ? "📝"
                          : "📋"}{" "}
                      dernière
                    </span>
                  </TableCell>
                  <TableCell>
                    {hasAccepted ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Accepté</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Suivi</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewProposalForClient(entry.clientId, latest);
                      }}
                      title="Mettre à jour et renvoyer une nouvelle proposition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Mettre à jour
                    </Button>
                  </TableCell>
                </TableRow>
                {isOpen && entry.items.map((p) => renderProposalRow(p, "sent"))}
              </React.Fragment>
            );
          })}
          {entries.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                Aucune proposition envoyée.
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
          {items.map((p) => renderProposalRow(p, mode))}
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
              onChange={(e) => setProposalSearch(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {proposals.length} proposition{proposals.length !== 1 ? "s" : ""}
          </p>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">Tous les types</option>
            <option value="classique">📋 Classique</option>
            <option value="unique">🎤 Unique</option>
            <option value="info">📝 Infos</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateSortAsc((prev) => !prev)}
            className="gap-1 text-xs"
            title="Trier par date"
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> {dateSortAsc ? "Plus anciennes d'abord" : "Plus récentes d'abord"}
          </Button>
          {testProposalCount > 0 && (
            <Button
              variant={hideTestProposals ? "outline" : "secondary"}
              size="sm"
              onClick={() => setHideTestProposals((prev) => !prev)}
              className="gap-1 text-xs"
            >
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
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Nouvelle proposition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">Créer une proposition</DialogTitle>
              </DialogHeader>
              {renderSpeakerForm()}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sous-onglets : brouillons, envoyées, archivées */}
      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="drafts">Brouillons ({drafts.length})</TabsTrigger>
          <TabsTrigger value="sent">Envoyées ({sent.length})</TabsTrigger>
          <TabsTrigger value="archived">Archivées ({archived.length})</TabsTrigger>
        </TabsList>

        {[
          { key: "drafts", items: drafts, mode: "draft" as const, allowDelete: false },
          { key: "sent", items: sent, mode: "sent" as const, allowDelete: false },
          { key: "archived", items: archived, mode: "sent" as const, allowDelete: true },
        ].map(({ key, items, mode, allowDelete }) => {
          const isSent = key === "sent";
          const sentEntries = isSent ? buildSentEntries(items) : [];
          const paginated = items.slice(0, pageSize);
          const paginatedEntries = isSent ? sentEntries.slice(0, pageSize) : [];
          return (
            <TabsContent key={key} value={key}>
              {key === "archived"
                ? (() => {
                    // Regrouper les propositions archivées via la chaîne previous_proposal_id
                    const archivedById = new Map<string, any>(paginated.map((p) => [p.id, p]));
                    // Pour chaque archivée, remonter au plus ancien archivé de la chaîne
                    const rootOf = new Map<string, string>();
                    for (const p of paginated) {
                      let cur: any = p;
                      while (cur && cur.previous_proposal_id && archivedById.has(cur.previous_proposal_id)) {
                        cur = archivedById.get(cur.previous_proposal_id);
                      }
                      rootOf.set(p.id, cur.id);
                    }
                    const groupsMap = new Map<string, any[]>();
                    for (const p of paginated) {
                      const r = rootOf.get(p.id) || p.id;
                      const arr = groupsMap.get(r) || [];
                      arr.push(p);
                      groupsMap.set(r, arr);
                    }
                    type ArchEntry =
                      | { kind: "single"; p: any }
                      | { kind: "group"; rootId: string; items: any[]; latest: any };
                    const entries: ArchEntry[] = [];
                    for (const [rootId, group] of groupsMap.entries()) {
                      const sorted = [...group].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      );
                      if (sorted.length === 1) entries.push({ kind: "single", p: sorted[0] });
                      else entries.push({ kind: "group", rootId, items: sorted, latest: sorted[0] });
                    }
                    entries.sort((a, b) => {
                      const da =
                        a.kind === "single"
                          ? new Date(a.p.created_at).getTime()
                          : new Date(a.latest.created_at).getTime();
                      const db =
                        b.kind === "single"
                          ? new Date(b.p.created_at).getTime()
                          : new Date(b.latest.created_at).getTime();
                      return dateSortAsc ? da - db : db - da;
                    });

                    const renderArchivedRow = (p: any, opts?: { indent?: boolean; versionLabel?: string }) => (
                      <TableRow key={p.id} className={opts?.indent ? "bg-background" : ""}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {opts?.indent && <span className="inline-block w-4" />}
                          {opts?.versionLabel && (
                            <span className="text-[10px] mr-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {opts.versionLabel}
                            </span>
                          )}
                          {new Date(p.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{p.client_name}</div>
                          <div className="text-xs text-muted-foreground">{p.client_email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground">
                            {(p.proposal_speakers || []).slice(0, 3).map((ps: any, i: number) => (
                              <span key={i}>
                                {ps.speakers?.name}
                                {i < Math.min(2, (p.proposal_speakers || []).length - 1) ? "," : ""}
                              </span>
                            ))}
                            {(p.proposal_speakers || []).length > 3 && (
                              <span>+{(p.proposal_speakers || []).length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {(p as any).proposal_type === "unique"
                              ? "🎤 Unique"
                              : (p as any).proposal_type === "info"
                                ? "📝 Infos"
                                : "📋 Classique"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-xs text-muted-foreground max-w-[220px] truncate"
                          title={(p as any).lost_reason || ""}
                        >
                          {(p as any).lost_reason || <span className="italic opacity-60">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            Archivée
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setArchiveDetailsId(p.id)}
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" asChild title="Voir en ligne">
                              <a href={getProposalUrl(p.token)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );

                    return (
                      <div className="border border-border rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Conférenciers</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Raison</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entries.map((entry) => {
                              if (entry.kind === "single") return renderArchivedRow(entry.p);
                              const isOpen = expandedArchivedGroupId === entry.rootId;
                              const latest = entry.latest;
                              return (
                                <React.Fragment key={`arch-group-${entry.rootId}`}>
                                  <TableRow
                                    className="bg-muted/40 hover:bg-muted/60 cursor-pointer"
                                    onClick={() => setExpandedArchivedGroupId(isOpen ? null : entry.rootId)}
                                  >
                                    <TableCell className="text-xs whitespace-nowrap font-medium">
                                      <div className="flex items-center gap-1.5">
                                        {isOpen ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                        {new Date(latest.created_at).toLocaleDateString("fr-FR")}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium text-sm">{latest.client_name}</div>
                                      <div className="text-xs text-muted-foreground">{latest.client_email}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {entry.items.length} versions
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        {(latest as any).proposal_type === "unique"
                                          ? "🎤 Unique"
                                          : (latest as any).proposal_type === "info"
                                            ? "📝 Infos"
                                            : "📋 Classique"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground italic">
                                      Chaîne de mises à jour
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                        Archivée ×{entry.items.length}
                                      </span>
                                    </TableCell>
                                    <TableCell />
                                  </TableRow>
                                  {isOpen &&
                                    entry.items.map((it, idx) =>
                                      renderArchivedRow(it, {
                                        indent: true,
                                        versionLabel: `v${entry.items.length - idx}`,
                                      }),
                                    )}
                                </React.Fragment>
                              );
                            })}
                            {entries.length === 0 && !loading && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                  Aucune proposition archivée.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()
                : isSent
                  ? renderGroupedSentTable(paginatedEntries)
                  : renderTable(paginated, mode)}
              {items.length > 10 && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <span>Afficher</span>
                  {([10, 50, 100] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPageSize(n)}
                      className={cn(
                        "px-2.5 py-1 rounded-md border transition-colors",
                        pageSize === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span>
                    · {Math.min(pageSize, items.length)} sur {items.length}
                  </span>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Éditer la proposition</DialogTitle>
          </DialogHeader>
          {(() => {
            const editType = (editingProposal?.proposal_type || "classique") as ProposalType;
            const isLocked = !!editingProposal && editingProposal.status !== "draft";
            const sentLabel = editingProposal?.sent_at
              ? new Date(editingProposal.sent_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null;
            return (
              <div className="space-y-6 mt-4">
                {isLocked && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    🔒 Proposition{" "}
                    {editingProposal?.status === "lost" || editingProposal?.status === "archived"
                      ? "archivée"
                      : `envoyée${sentLabel ? ` le ${sentLabel}` : ""}`}{" "}
                    — formulaire en lecture seule. Utilise le bouton « Nouvelle » pour repartir d'une nouvelle
                    proposition.
                  </div>
                )}
                <fieldset disabled={isLocked} className={isLocked ? "opacity-80 pointer-events-none" : ""}>
                  <div className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground w-fit">
                    {editType === "unique"
                      ? "🎤 Conférencier unique"
                      : editType === "info"
                        ? "📝 Demande d'infos"
                        : "📋 Classique"}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Société / Nom du client</Label>
                      <Input value={editClientName} onChange={(e) => setEditClientName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email du client</Label>
                      <Input
                        type="email"
                        value={editClientEmail}
                        onChange={(e) => setEditClientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Prénom Nom du destinataire</Label>
                    <Input value={editRecipientName} onChange={(e) => setEditRecipientName(e.target.value)} />
                  </div>

                  {editType !== "info" && (
                    <div className="border-t border-border pt-4">
                      <h3 className="font-medium text-sm mb-3">🎤 Conférenciers et tarifs</h3>
                      {renderSpeakerSelectionEditor(editSelectedSpeakers, setEditSelectedSpeakers)}
                    </div>
                  )}

                  {matchingLeads.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">📨 Messages reçus du client ({matchingLeads.length})</Label>
                        <button
                          type="button"
                          onClick={() => setShowLeadsPanel((v) => !v)}
                          className="text-[10px] text-muted-foreground hover:text-foreground underline"
                        >
                          {showLeadsPanel ? "Masquer" : "Afficher"}
                        </button>
                      </div>
                      {showLeadsPanel && (
                        <div className="border border-border rounded-md bg-muted/20 max-h-[300px] overflow-y-auto divide-y divide-border">
                          {matchingLeads.map((lead) => {
                            const date = new Date(lead.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
                            return (
                              <div key={lead.id} className="p-2.5 text-xs space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium">{fullName || "Sans nom"}</span>
                                  <span className="text-[10px] text-muted-foreground">{date}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2">
                                  <span className="bg-background px-1.5 rounded">{lead.lead_type}</span>
                                  {lead.company && <span>🏢 {lead.company}</span>}
                                  {lead.phone && <span>📞 {lead.phone}</span>}
                                </div>
                                {(lead.event_date || lead.location || lead.audience_size || lead.budget) && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {lead.event_date && <span>📅 {lead.event_date}</span>}
                                    {lead.location && <span> · 📍 {lead.location}</span>}
                                    {lead.audience_size && <span> · 👥 {lead.audience_size}</span>}
                                    {lead.budget && <span> · 💶 {lead.budget}</span>}
                                  </div>
                                )}
                                {lead.additional_info && (
                                  <div className="bg-background border border-border rounded p-1.5 mt-1 whitespace-pre-wrap text-foreground/90">
                                    {lead.additional_info}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-sm mb-3">✉️ Email d'envoi</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Objet</Label>
                        <Input value={editEmailSubject} onChange={(e) => setEditEmailSubject(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Corps du mail</Label>
                        <SimpleRichTextEditor value={editEmailBody} onChange={setEditEmailBody} rows={10} />
                      </div>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setShowEditPreview(!showEditPreview)}
                        >
                          {showEditPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {showEditPreview ? "Masquer l'aperçu" : "Aperçu réel de l'email envoyé"}
                        </Button>
                        {showEditPreview && (
                          <EmailPreviewCard
                            to={editClientEmail}
                            subject={getResolvedEmailSubject(editType, editEmailSubject, editClientName)}
                            body={getResolvedEmailBody({
                              type: editType,
                              body: editEmailBody,
                              recipientName: editRecipientName,
                              clientName: editClientName,
                              selectedSpeakers: editSelectedSpeakers,
                              speakers,
                              eventDateText: (editingProposal as any)?.event_date_text,
                              eventLocation: (editingProposal as any)?.event_location,
                              audienceSize: (editingProposal as any)?.audience_size,
                            })}
                            showProposalButton={editType === "classique"}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <Label className="text-sm font-medium">🗒️ Notes internes (relances et suivi)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Visible uniquement en interne. Reportée automatiquement aux prochaines versions de cette
                      proposition.
                    </p>
                    <Textarea
                      value={editInternalNotes}
                      onChange={(e) => setEditInternalNotes(e.target.value)}
                      rows={4}
                      disabled={isLocked}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleSaveEdit(true)}
                      disabled={submitting || isLocked}
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? "Envoi…" : "Sauvegarder et envoyer"}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleSaveEdit(false)}
                      disabled={submitting || isLocked}
                    >
                      <Save className="h-4 w-4" />
                      {submitting ? "Sauvegarde…" : "Enregistrer le brouillon"}
                    </Button>
                  </div>
                </fieldset>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Archive details dialog */}
      <Dialog open={!!archiveDetailsId} onOpenChange={(o) => !o && setArchiveDetailsId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Détails de la proposition archivée</DialogTitle>
          </DialogHeader>
          {(() => {
            const p: any = proposals.find((x) => x.id === archiveDetailsId);
            if (!p) return null;
            const tasks = getTasksForProposal(p.id);
            const fmt = (d?: string | null) =>
              d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
            return (
              <div className="space-y-4 mt-2 text-sm">
                <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                  <p>
                    <strong>Client :</strong> {p.client_name}
                  </p>
                  <p>
                    <strong>Email :</strong> {p.client_email}
                  </p>
                  {p.recipient_name && (
                    <p>
                      <strong>Destinataire :</strong> {p.recipient_name}
                    </p>
                  )}
                  {p.client_phone && (
                    <p>
                      <strong>Tél :</strong> {p.client_phone}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Créée le :</span> {fmt(p.created_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Envoyée le :</span> {fmt(p.sent_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Relance 1 :</span> {fmt(p.reminder1_sent_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Relance 2 :</span> {fmt(p.reminder2_sent_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Archivée le :</span> {fmt(p.lost_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expire :</span> {fmt(p.expires_at)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Raison de l'archivage</Label>
                  <div className="rounded-md border border-border bg-muted/20 p-2 text-sm">
                    {p.lost_reason || <span className="italic opacity-60">—</span>}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Conférenciers proposés</Label>
                  {!p.proposal_speakers || p.proposal_speakers.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground mt-1">Aucun conférencier.</p>
                  ) : (
                    <div className="space-y-1 mt-1">
                      {[...p.proposal_speakers]
                        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                        .map((ps: any) => {
                          const total =
                            Number(ps.total_price) ||
                            (Number(ps.speaker_fee) || 0) +
                              (Number(ps.travel_costs) || 0) +
                              (Number(ps.agency_commission) || 0);
                          const fee = Number(ps.speaker_fee) || 0;
                          const travel = Number(ps.travel_costs) || 0;
                          const commission = Number(ps.agency_commission) || 0;
                          const fmtEur = (n: number) => `${n.toLocaleString("fr-FR")} €`;
                          return (
                            <div
                              key={ps.speaker_id}
                              className="rounded-md border border-border bg-muted/20 px-2.5 py-2 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{ps.speakers?.name || "Conférencier"}</span>
                                <span className="font-semibold">{total > 0 ? `${fmtEur(total)} HT` : "—"}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-[11px]">
                                <span>Honoraires : {fmtEur(fee)}</span>
                                <span>Frais déplacement : {fmtEur(travel)}</span>
                                <span>Commission agence : {fmtEur(commission)}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Notes des relances</Label>
                  {tasks.length === 0 && <p className="text-xs italic text-muted-foreground">Aucune tâche.</p>}
                  {tasks.map((t: any) => (
                    <div key={t.id} className="rounded-md border border-border p-2 mt-2 text-xs">
                      <div className="font-medium mb-1">
                        {t.task_type === "relance_1" ? "Relance 1" : "Relance 2"} · échéance {fmt(t.due_date)}{" "}
                        {t.status === "completed" && <span className="text-emerald-600">✓</span>}
                      </div>
                      {t.note ? (
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: t.note }} />
                      ) : (
                        <span className="italic text-muted-foreground">Aucune note.</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">🔔 Relances — {reminderProposal?.client_name}</DialogTitle>
          </DialogHeader>
          {reminderProposal && (
            <div className="space-y-6 mt-4">
              {/* Client info */}
              <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <strong>Client :</strong> {reminderProposal.client_name}
                </p>
                <p>
                  <strong>Email :</strong> {reminderProposal.client_email}
                </p>
                {reminderProposal.recipient_name && (
                  <p>
                    <strong>Destinataire :</strong> {reminderProposal.recipient_name}
                  </p>
                )}
                {(reminderProposal as any).client_phone && (
                  <p>
                    <strong>Tél :</strong> {(reminderProposal as any).client_phone}
                  </p>
                )}
              </div>

              {/* Simplified reminder block */}
              <div className="space-y-4">
                {(reminderProposal as any).reminder2_sent_at ? (
                  <>
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" /> Rappel agenda complémentaire (pas d'email envoyé)
                    </h3>

                    <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Historique des relances</p>
                        {(reminderProposal as any).reminder1_sent_at && (
                          <p className="text-[11px] text-blue-600">
                            • Relance 1 envoyée le{" "}
                            {new Date((reminderProposal as any).reminder1_sent_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                        {(reminderProposal as any).reminder2_sent_at && (
                          <p className="text-[11px] text-blue-600">
                            • Relance 2 envoyée le{" "}
                            {new Date((reminderProposal as any).reminder2_sent_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                        {simpleReminderNote && (
                          <div className="mt-2 pt-2 border-t border-border/60">
                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Notes des relances précédentes</p>
                            <div
                              className="text-xs text-muted-foreground prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: simpleReminderNote }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 items-start pt-2 border-t border-border/60">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date du rappel agenda</Label>
                          <Input
                            type="date"
                            value={simpleFollowupDate}
                            onChange={(e) => setSimpleFollowupDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Notes du rappel</Label>
                          <SimpleRichTextEditor
                            value={simpleFollowupNote}
                            onChange={setSimpleFollowupNote}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-medium text-sm flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" /> Relance prévue
                    </h3>

                    <div className="border border-border rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 items-start">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Date de relance prévue</Label>
                          <Input
                            type="date"
                            value={simpleReminderDate}
                            onChange={(e) => setSimpleReminderDate(e.target.value)}
                          />
                          {(reminderProposal as any).reminder1_sent_at && (
                            <p className="text-[10px] text-blue-600">
                              R1 envoyée le{" "}
                              {new Date((reminderProposal as any).reminder1_sent_at).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <SimpleRichTextEditor
                            value={simpleReminderNote}
                            onChange={setSimpleReminderNote}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button variant="outline" size="sm" className="gap-1" onClick={saveTaskEdits}>
                  <Save className="h-3 w-3" /> Enregistrer
                </Button>
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
                    ✓ Déjà envoyée le{" "}
                    {new Date(
                      (reminderProposal as any)[activeReminderNum === 1 ? "reminder1_sent_at" : "reminder2_sent_at"],
                    ).toLocaleDateString("fr-FR")}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Objet</Label>
                  <Input value={reminderSubject} onChange={(e) => setReminderSubject(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Corps du mail</Label>
                  <SimpleRichTextEditor value={reminderBody} onChange={setReminderBody} />
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={
                    !!(reminderProposal as any)[activeReminderNum === 1 ? "reminder1_sent_at" : "reminder2_sent_at"] ||
                    sending === reminderProposal.id
                  }
                  onClick={async () => {
                    await handleReminder(reminderProposal, activeReminderNum, reminderSubject, reminderBody);
                    const taskType = activeReminderNum === 1 ? "relance_1" : "relance_2";
                    const task = editingTasks.find((t: any) => t.task_type === taskType);
                    if (task) {
                      await supabase
                        .from("proposal_tasks")
                        .update({ status: "completed", completed_at: new Date().toISOString() } as any)
                        .eq("id", task.id);
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

      {/* Leads matchés par email */}
      <Dialog open={!!leadsDialogProposal} onOpenChange={(o) => !o && setLeadsDialogProposal(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Messages reçus du client</DialogTitle>
          </DialogHeader>
          {leadsDialogProposal &&
            (() => {
              const matches = getMatchingLeads(leadsDialogProposal.client_email);
              if (matches.length === 0)
                return (
                  <p className="text-sm text-muted-foreground">
                    Aucun message trouvé pour {leadsDialogProposal.client_email}.
                  </p>
                );
              return (
                <div className="space-y-4 mt-2">
                  <p className="text-xs text-muted-foreground">
                    {matches.length} message{matches.length > 1 ? "s" : ""} reçu{matches.length > 1 ? "s" : ""} de{" "}
                    <span className="text-foreground font-medium">{leadsDialogProposal.client_email}</span>
                  </p>
                  {matches.map((l: any) => (
                    <div key={l.id} className="border border-border rounded-lg p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-sm font-medium">
                          {l.first_name} {l.last_name} {l.company ? `· ${l.company}` : ""}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-background border border-border">
                            {l.lead_type || "Simulateur"}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {l.phone && <div>📞 {l.phone}</div>}
                        {l.event_date && <div>📅 {l.event_date}</div>}
                        {l.event_type && <div>🎯 {l.event_type}</div>}
                        {l.audience_size && <div>👥 {l.audience_size}</div>}
                        {l.location && <div>📍 {l.location}</div>}
                        {l.budget && <div>💰 {l.budget}</div>}
                      </div>
                      {l.objective && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Objectif :</span> {l.objective}
                        </div>
                      )}
                      {l.additional_info && (
                        <div className="text-sm whitespace-pre-wrap bg-background border border-border rounded p-2 leading-relaxed">
                          {l.additional_info}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
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

      {/* Dialog : Archivage avec raison obligatoire */}
      <Dialog
        open={!!archiveDialogId}
        onOpenChange={(o) => {
          if (!o) setArchiveDialogId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archiver la proposition</DialogTitle>
            <DialogDescription>
              Indiquez la raison de l'archivage. Les notes et tâches existantes seront conservées et restent
              consultables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Catégorie</Label>
              <Select value={archiveReasonCategory} onValueChange={setArchiveReasonCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prix">Prix</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="profil">Profil</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Détails (recommandé)</Label>
              <Textarea value={archiveReasonText} onChange={(e) => setArchiveReasonText(e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setArchiveDialogId(null)}>
              Annuler
            </Button>
            <Button onClick={submitArchive} disabled={archiveSubmitting}>
              {archiveSubmitting ? "Archivage…" : "Archiver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog : proposition existante détectée pour ce client */}
      <Dialog open={!!linkDialog} onOpenChange={(o) => !o && setLinkDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Proposition existante détectée</DialogTitle>
            <DialogDescription>
              Une proposition envoyée existe déjà pour <strong>{clientEmail}</strong>
              {linkDialog?.candidate.recipient_name ? ` (destinataire : ${linkDialog.candidate.recipient_name})` : ""}
              , créée le{" "}
              {linkDialog?.candidate.created_at
                ? new Date(linkDialog.candidate.created_at).toLocaleDateString("fr-FR")
                : ""}
              .
              <br />
              <br />
              Voulez-vous créer une nouvelle version qui remplacera l'ancienne (archivée
              automatiquement) ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                const d = linkDialog;
                setLinkDialog(null);
                if (d) doCreate(d.andSend, d.candidate.id);
              }}
            >
              Oui, nouvelle version
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const d = linkDialog;
                setLinkDialog(null);
                if (d) doCreate(d.andSend, null);
              }}
            >
              Non, proposition indépendante
            </Button>
            <Button variant="ghost" onClick={() => setLinkDialog(null)}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
};

// (AdminContractsContent moved to src/components/admin/AdminEventDossiers.tsx)

export default Admin;
