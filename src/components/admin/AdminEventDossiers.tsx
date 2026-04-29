import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, Search, ChevronDown, ChevronUp, Trash2, Check, X, FilePlus,
  AlertTriangle, CalendarDays, FileSignature, CreditCard, Video, ClipboardList, Receipt, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import EventDossier from "@/components/admin/EventDossier";
import ContractPipeline, { PipelineStage } from "@/components/admin/ContractPipeline";
import { cn } from "@/lib/utils";

type Proposal = any;
type Contract = any;
type Invoice = any;
type EventRow = any;

const formatShortDate = (val: string | null | undefined) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" });
};

const Bool = ({ value, date }: { value: boolean; date?: string | null }) =>
  value ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium" title={date ? formatShortDate(date) || "" : ""}>
      <Check className="h-3.5 w-3.5" /> {date ? formatShortDate(date) : "Oui"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground/70 text-xs">
      <X className="h-3.5 w-3.5" />
    </span>
  );

const DateCell = ({ value }: { value?: string | null }) =>
  value ? (
    <span className="text-xs text-emerald-700 font-medium">{formatShortDate(value)}</span>
  ) : (
    <span className="text-muted-foreground/60 text-xs">—</span>
  );

const AdminEventDossiers = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"en_cours" | "archives">("en_cours");
  const [archiveFilter, setArchiveFilter] = useState<"all" | "gagne" | "perdu">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<10 | 50 | 100>(10);
  const [lostDialogId, setLostDialogId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  // Direct contract creation (without prior proposal)
  const [directOpen, setDirectOpen] = useState(false);
  const [directClients, setDirectClients] = useState<Array<{ id: string; company_name: string; contact_name: string | null; email: string | null }>>([]);
  const [directClientId, setDirectClientId] = useState("");
  const [directClientSearch, setDirectClientSearch] = useState("");
  const [directClientMode, setDirectClientMode] = useState<"existing" | "new">("existing");
  const [directClientName, setDirectClientName] = useState("");
  const [directClientEmail, setDirectClientEmail] = useState("");
  const [directRecipientName, setDirectRecipientName] = useState("");
  const [directEventDate, setDirectEventDate] = useState("");
  const [directEventLocation, setDirectEventLocation] = useState("");
  const [directAudienceSize, setDirectAudienceSize] = useState("");
  const [directCreating, setDirectCreating] = useState(false);
  // Speaker selection for direct contract
  const [directSpeakers, setDirectSpeakers] = useState<Array<{ id: string; name: string; base_fee: number | null; email: string | null; phone: string | null }>>([]);
  const [directSpeakerIds, setDirectSpeakerIds] = useState<string[]>([]);
  const [directSpeakerSearch, setDirectSpeakerSearch] = useState("");

  // Visio quick scheduler (déclenché depuis la pipeline)
  const [visioDialog, setVisioDialog] = useState<{ eventId: string; date: string; time: string } | null>(null);
  const [savingVisio, setSavingVisio] = useState(false);

  const openVisioPicker = (eventRow: any) => {
    if (!eventRow) { toast.error("Créez d'abord le dossier événement"); return; }
    setVisioDialog({
      eventId: eventRow.id,
      date: eventRow.visio_date || "",
      time: eventRow.visio_time || "",
    });
  };

  const handleSaveVisio = async () => {
    if (!visioDialog) return;
    setSavingVisio(true);
    const { error } = await supabase.from("events").update({
      visio_date: visioDialog.date || null,
      visio_time: visioDialog.time || null,
    } as any).eq("id", visioDialog.eventId);
    if (error) toast.error("Erreur");
    else { toast.success("Visio planifiée"); setVisioDialog(null); fetchData(); }
    setSavingVisio(false);
  };

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes, iRes, eRes] = await Promise.all([
      supabase.from("proposals").select("*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, display_order, selected_conference_ids, speakers(name, image_url, formal_address, email, phone))").eq("status", "accepted").order("created_at", { ascending: false }),
      supabase.from("contracts").select("id, proposal_id, status, created_at, contract_sent_at, signed_at, client_signed_received_at, event_date").order("created_at", { ascending: false }),
      supabase.from("invoices").select("id, proposal_id, invoice_type, status, paid_at, sent_at, due_date").order("created_at", { ascending: false }),
      supabase.from("events").select("*").order("created_at", { ascending: false }),
    ]);
    setProposals((pRes.data as any) || []);
    setContracts((cRes.data as any) || []);
    setInvoices((iRes.data as any) || []);
    setEvents((eRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openDirectContract = async () => {
    const [{ data: cl }, { data: sp }] = await Promise.all([
      supabase.from("clients").select("id, company_name, contact_name, email").order("company_name"),
      supabase.from("speakers").select("id, name, base_fee, email, phone").eq("archived", false).order("name"),
    ]);
    setDirectClients((cl as any) || []);
    setDirectSpeakers((sp as any) || []);
    setDirectClientId("");
    setDirectClientSearch("");
    setDirectClientMode("existing");
    setDirectClientName("");
    setDirectClientEmail("");
    setDirectRecipientName("");
    setDirectEventDate("");
    setDirectEventLocation("");
    setDirectAudienceSize("");
    setDirectSpeakerIds([]);
    setDirectSpeakerSearch("");
    setDirectOpen(true);
  };

  const handleCreateDirectContract = async () => {
    let resolvedClientId = directClientId || null;
    let clientName = "";
    let clientEmail = "";
    let recipient = directRecipientName.trim();

    if (directClientMode === "existing") {
      const sel = directClients.find((c) => c.id === directClientId);
      if (!sel) { toast.error("Sélectionnez un client"); return; }
      clientName = sel.company_name;
      clientEmail = sel.email || "";
      if (!recipient) recipient = sel.contact_name || "";
      if (!clientEmail) { toast.error("Ce client n'a pas d'email — complétez sa fiche d'abord"); return; }
    } else {
      clientName = directClientName.trim();
      clientEmail = directClientEmail.trim();
      if (!clientName) { toast.error("Nom du client requis"); return; }
      if (!clientEmail) { toast.error("Email du client requis"); return; }
    }

    setDirectCreating(true);
    try {
      // 0) Create client in CRM if "new" mode
      if (directClientMode === "new") {
        const { data: newCl, error: clErr } = await supabase.from("clients").insert({
          company_name: clientName,
          email: clientEmail,
          contact_name: recipient || null,
          status: "client",
        } as any).select("id").single();
        if (clErr) throw clErr;
        resolvedClientId = newCl?.id || null;
      }

      // 1) Create accepted "direct" proposal (placeholder shell)
      const { data: prop, error: pErr } = await supabase.from("proposals").insert({
        client_name: clientName,
        client_email: clientEmail,
        recipient_name: recipient || null,
        client_id: resolvedClientId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
        proposal_type: "direct",
        event_location: directEventLocation || null,
        event_date_text: directEventDate || null,
        audience_size: directAudienceSize || null,
        message: "Contrat créé directement (sans proposition).",
      } as any).select("id").single();
      if (pErr || !prop) throw pErr || new Error("create proposal failed");

      // 2) Create event shell (with selected speaker if exactly one chosen)
      const selectedSpeakerId = directSpeakerIds.length === 1 ? directSpeakerIds[0] : null;
      await supabase.from("events").insert({
        proposal_id: prop.id,
        event_date: directEventDate || null,
        audience_size: directAudienceSize || null,
        selected_speaker_id: selectedSpeakerId,
      } as any);

      // 3) Insert proposal_speakers rows for each chosen speaker
      if (directSpeakerIds.length > 0) {
        const rows = directSpeakerIds.map((sid, idx) => {
          const sp = directSpeakers.find((s) => s.id === sid);
          const fee = sp?.base_fee ?? 0;
          return {
            proposal_id: prop.id,
            speaker_id: sid,
            speaker_fee: fee,
            travel_costs: 0,
            agency_commission: 0,
            total_price: fee,
            display_order: idx,
          };
        });
        await supabase.from("proposal_speakers").insert(rows as any);
      }

      toast.success("Contrat direct créé — finalisez le contrat dans le dossier.");
      setDirectOpen(false);
      await fetchData();
      setExpandedId(prop.id);
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors de la création");
    }
    setDirectCreating(false);
  };

  const enriched = useMemo(() => {
    return proposals.map((p) => {
      const pContract = contracts.find((c) => c.proposal_id === p.id);
      const pEvent = events.find((e) => e.proposal_id === p.id);
      const pInvoices = invoices.filter((i) => i.proposal_id === p.id);
      const acompte = pInvoices.find((i) => i.invoice_type === "acompte");
      const solde = pInvoices.find((i) => i.invoice_type === "solde");
      const total = pInvoices.find((i) => i.invoice_type === "total");
      const finalInvoice = solde || total;

      // Client-side dates
      const contractSentClient = pContract?.contract_sent_at || null;
      const clientSigned = pContract?.client_signed_received_at || pContract?.signed_at || null;
      const clientDepositPaid = pEvent?.client_deposit_paid_at || acompte?.paid_at || null;
      const invoiceSentClient = pEvent?.client_invoice_sent_at || finalInvoice?.sent_at || null;
      const invoicePaidClient = pEvent?.client_invoice_paid_at || finalInvoice?.paid_at || null;

      // Speaker-side dates
      const contractSentSpeaker = pEvent?.contract_sent_speaker_at || null;
      const speakerAck = pEvent?.speaker_acknowledgment_at || null;
      const speakerSigned = pEvent?.speaker_signed_contract_at || null;
      const speakerDepositPaid = pEvent?.speaker_deposit_paid_at || null;
      const speakerPaid = pEvent?.speaker_paid_at || null;

      // Visio + liaison
      const visioDate = pEvent?.visio_date || null;
      const liaisonSent = pEvent?.liaison_sheet_sent_at || null;

      // Event date for sorting/display
      const eventDateRaw = pEvent?.event_date || pContract?.event_date || null;
      const eventDate = eventDateRaw ? new Date(eventDateRaw + (eventDateRaw.length === 10 ? "T12:00:00" : "")) : null;

      const bdc = pEvent?.bdc_number || null;

      // Status
      const allInvoicesPaid = pInvoices.length > 0 && pInvoices.every((i) => i.status === "paid");
      const isLost = !!p.lost_at;
      const isWon = allInvoicesPaid && !!speakerPaid && !isLost;
      const archiveStatus: "gagne" | "perdu" | null = isLost ? "perdu" : (isWon ? "gagne" : null);

      // Build pipeline (10 stages)
      const stages: PipelineStage[] = [
        { key: "contract_sent", label: "Contrat envoyé client", shortLabel: "Contrat env.", doneAt: contractSentClient,
          toggle: pContract ? { table: "contracts", rowId: pContract.id, field: "contract_sent_at", valueType: "timestamp" } : undefined },
        { key: "client_signed", label: "Contrat signé client", shortLabel: "Signé client", doneAt: clientSigned,
          toggle: pContract ? { table: "contracts", rowId: pContract.id, field: "client_signed_received_at", valueType: "date" } : undefined },
        { key: "client_deposit", label: "Acompte client reçu", shortLabel: "Acpte client", doneAt: clientDepositPaid,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "client_deposit_paid_at", valueType: "date" } : undefined },
        { key: "speaker_communication", label: "Communication speaker envoyée", shortLabel: "Comm. speaker", doneAt: pEvent?.info_sent_speaker_at || null,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "info_sent_speaker_at", valueType: "timestamp" } : undefined },
        { key: "speaker_ack", label: "AR speaker (accusé de réception)", shortLabel: "AR speaker",
          doneAt: speakerAck,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "speaker_acknowledgment_at", valueType: "date" } : undefined },
        { key: "visio", label: "Visio préparatoire", shortLabel: "Visio", doneAt: visioDate,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "visio_date", valueType: "date" } : undefined,
          customAction: "visio" },
        { key: "liaison", label: "Feuille de liaison", shortLabel: "Liaison", doneAt: liaisonSent,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "liaison_sheet_sent_at", valueType: "timestamp" } : undefined },
        { key: "invoice_sent", label: "Facture envoyée", shortLabel: "Facture env.", doneAt: invoiceSentClient,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "client_invoice_sent_at", valueType: "date" } : undefined },
        { key: "invoice_paid", label: "Facture payée", shortLabel: "Facture payée", doneAt: invoicePaidClient,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "client_invoice_paid_at", valueType: "date" } : undefined },
        { key: "speaker_paid", label: "Conférencier payé", shortLabel: "Speaker payé", doneAt: speakerPaid,
          toggle: pEvent ? { table: "events", rowId: pEvent.id, field: "speaker_paid_at", valueType: "timestamp" } : undefined },
      ];

      const completedCount = stages.filter((s) => !!s.doneAt).length;
      const nextStage = stages.find((s) => !s.doneAt) || null;
      const progress = Math.round((completedCount / stages.length) * 100);

      return {
        proposal: p,
        contract: pContract,
        event: pEvent,
        invoices: pInvoices,
        bdc,
        eventDate,
        eventDateRaw,
        clientSigned,
        speakerSigned,
        clientDepositPaid,
        speakerDepositPaid,
        visioDate,
        liaisonSent,
        invoiceSentClient,
        invoicePaidClient,
        speakerPaid,
        speakerAck,
        contractSentSpeaker,
        archiveStatus,
        isArchived: !!archiveStatus,
        stages,
        completedCount,
        nextStage,
        progress,
      };
    });
  }, [proposals, contracts, invoices, events]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (tab === "en_cours") {
      list = list.filter((r) => !r.isArchived);
    } else {
      list = list.filter((r) => r.isArchived);
      if (archiveFilter !== "all") {
        list = list.filter((r) => r.archiveStatus === archiveFilter);
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const name = (r.proposal.client_name || "").toLowerCase();
        const email = (r.proposal.client_email || "").toLowerCase();
        const bdc = (r.bdc || "").toLowerCase();
        return name.includes(q) || email.includes(q) || bdc.includes(q);
      });
    }
    // Sort by event date ascending (closest first), undated last
    list = [...list].sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return 0;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return a.eventDate.getTime() - b.eventDate.getTime();
    });
    return list;
  }, [enriched, tab, archiveFilter, search]);

  const counts = useMemo(() => ({
    enCours: enriched.filter((r) => !r.isArchived).length,
    archives: enriched.filter((r) => r.isArchived).length,
    gagnes: enriched.filter((r) => r.archiveStatus === "gagne").length,
    perdus: enriched.filter((r) => r.archiveStatus === "perdu").length,
  }), [enriched]);

  // KPI: nombre de dossiers en cours bloqués sur chaque étape
  const stageKpis = useMemo(() => {
    const active = enriched.filter((r) => !r.isArchived);
    const count = (key: string) => active.filter((r) => r.nextStage?.key === key).length;
    return [
      { key: "contract_sent", label: "Contrat à envoyer", icon: FileSignature, count: count("contract_sent") },
      { key: "client_signed", label: "Signature client attendue", icon: FileSignature, count: count("client_signed") },
      { key: "client_deposit", label: "Acompte client attendu", icon: CreditCard, count: count("client_deposit") },
      { key: "speaker_ack", label: "AR conférencier attendu", icon: ClipboardList, count: count("speaker_ack") },
      { key: "visio", label: "Visio à planifier", icon: Video, count: count("visio") },
      { key: "liaison", label: "Liaison à envoyer", icon: ClipboardList, count: count("liaison") },
      { key: "invoice_sent", label: "Facture à envoyer", icon: Receipt, count: count("invoice_sent") },
      { key: "invoice_paid", label: "Paiement client attendu", icon: Wallet, count: count("invoice_paid") },
    ];
  }, [enriched]);

  // Alertes "à traiter cette semaine"
  const weekAlerts = useMemo(() => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);
    return enriched
      .filter((r) => !r.isArchived)
      .map((r) => {
        const alerts: string[] = [];
        if (r.eventDate && r.eventDate >= now && r.eventDate <= in7) {
          alerts.push(`📅 Événement dans ${Math.ceil((r.eventDate.getTime() - now.getTime()) / 86400000)}j`);
        }
        if (r.contractSentSpeaker && !r.speakerAck) {
          const sent = new Date(r.contractSentSpeaker);
          const days = Math.floor((now.getTime() - sent.getTime()) / 86400000);
          if (days >= 3) alerts.push(`⏳ AR conférencier en retard (${days}j)`);
        }
        if (r.invoiceSentClient && !r.invoicePaidClient) {
          const sent = new Date(r.invoiceSentClient + (r.invoiceSentClient.length === 10 ? "T12:00:00" : ""));
          const days = Math.floor((now.getTime() - sent.getTime()) / 86400000);
          if (days >= 30) alerts.push(`💰 Facture impayée (${days}j)`);
        }
        if (r.visioDate) {
          const v = new Date(r.visioDate + "T12:00:00");
          if (v >= now && v <= in7) alerts.push(`🎥 Visio dans ${Math.ceil((v.getTime() - now.getTime()) / 86400000)}j`);
        }
        return { row: r, alerts };
      })
      .filter((x) => x.alerts.length > 0);
  }, [enriched]);

  // Calendrier 30 jours
  const upcoming30 = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    return enriched
      .filter((r) => !r.isArchived && r.eventDate && r.eventDate >= now && r.eventDate <= in30)
      .sort((a, b) => (a.eventDate!.getTime() - b.eventDate!.getTime()))
      .slice(0, 10);
  }, [enriched]);

  const handleMarkLost = async () => {
    if (!lostDialogId) return;
    const { error } = await supabase.from("proposals").update({ lost_at: new Date().toISOString(), lost_reason: lostReason || null } as any).eq("id", lostDialogId);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Dossier marqué comme perdu");
    setLostDialogId(null);
    setLostReason("");
    fetchData();
  };

  const handleRestoreFromLost = async (id: string) => {
    const { error } = await supabase.from("proposals").update({ lost_at: null, lost_reason: null } as any).eq("id", id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Dossier restauré");
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteDialogId) return;
    await supabase.from("invoices").delete().eq("proposal_id", deleteDialogId);
    await supabase.from("events").delete().eq("proposal_id", deleteDialogId);
    await supabase.from("contracts").delete().eq("proposal_id", deleteDialogId);
    await supabase.from("proposal_tasks").delete().eq("proposal_id", deleteDialogId);
    await supabase.from("proposal_speakers").delete().eq("proposal_id", deleteDialogId);
    const { error } = await supabase.from("proposals").delete().eq("id", deleteDialogId);
    if (error) { toast.error("Erreur de suppression"); return; }
    toast.success("Dossier supprimé");
    setDeleteDialogId(null);
    fetchData();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-serif font-bold">Contrats</h2>
          <p className="text-xs text-muted-foreground">Pipeline complet du contrat à la facturation finale</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={openDirectContract}>
            <FilePlus className="h-3.5 w-3.5" /> Nouveau contrat direct
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard : KPI + Alertes + Calendrier (uniquement onglet En cours) */}
      {tab === "en_cours" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* KPI compteurs */}
          <div className="lg:col-span-2 border border-border rounded-xl p-3 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">À traiter par étape</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stageKpis.map((k) => (
                <div key={k.key} className="rounded-lg border border-border bg-background px-2.5 py-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground leading-tight">
                    <k.icon className="h-3 w-3 shrink-0" />
                    <span>{k.label}</span>
                  </div>
                  <div className={cn("text-2xl font-bold mt-0.5", k.count > 0 ? "text-primary" : "text-muted-foreground/40")}>
                    {k.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendrier 30j */}
          <div className="border border-border rounded-xl p-3 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Prochains événements (30j)</h3>
            </div>
            {upcoming30.length === 0 ? (
              <div className="text-xs text-muted-foreground/70 py-3 text-center">Aucun événement à venir</div>
            ) : (
              <ul className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {upcoming30.map((r) => {
                  const days = Math.ceil((r.eventDate!.getTime() - Date.now()) / 86400000);
                  return (
                    <li key={r.proposal.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(r.proposal.id)}
                        className="w-full flex items-center justify-between gap-2 text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{r.proposal.client_name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {r.eventDate!.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0",
                          days <= 7 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground",
                        )}>
                          J-{days}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Alertes "à traiter cette semaine" */}
      {tab === "en_cours" && weekAlerts.length > 0 && (
        <div className="border border-orange-200 bg-orange-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-900">À traiter cette semaine ({weekAlerts.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {weekAlerts.slice(0, 6).map(({ row, alerts }) => (
              <button
                key={row.proposal.id}
                type="button"
                onClick={() => setExpandedId(row.proposal.id)}
                className="text-left bg-background rounded-md px-2.5 py-1.5 border border-orange-200/60 hover:border-orange-400 transition-colors"
              >
                <div className="text-xs font-medium">{row.proposal.client_name}</div>
                <div className="text-[10px] text-orange-700 mt-0.5 flex flex-wrap gap-x-2">
                  {alerts.map((a, i) => <span key={i}>{a}</span>)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setExpandedId(null); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="en_cours" className="gap-1.5 text-xs">
            📂 En cours <span className="ml-1 bg-muted-foreground/20 text-muted-foreground rounded-full px-1.5 text-[10px]">{counts.enCours}</span>
          </TabsTrigger>
          <TabsTrigger value="archives" className="gap-1.5 text-xs">
            📦 Archivés <span className="ml-1 bg-muted-foreground/20 text-muted-foreground rounded-full px-1.5 text-[10px]">{counts.archives}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom client ou n° de bon de commande…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {tab === "archives" && (
          <Select value={archiveFilter} onValueChange={(v) => setArchiveFilter(v as any)}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous ({counts.archives})</SelectItem>
              <SelectItem value="gagne">🏆 Gagnés ({counts.gagnes})</SelectItem>
              <SelectItem value="perdu">❌ Perdus ({counts.perdus})</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Aucun dossier</div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Client</TableHead>
                <TableHead className="whitespace-nowrap w-[130px]">Date événement</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead className="w-[140px]">Progression</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, pageSize).map((r) => {
                const p = r.proposal;
                const isExpanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50 align-top"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <TableCell className="py-3">
                        <div className="font-medium text-sm">{p.client_name}</div>
                        {r.bdc && <div className="text-[10px] text-muted-foreground">BDC {r.bdc}</div>}
                        {r.archiveStatus === "perdu" && <div className="text-[10px] text-orange-600 mt-0.5">❌ Perdu</div>}
                        {r.archiveStatus === "gagne" && <div className="text-[10px] text-emerald-600 mt-0.5">🏆 Gagné</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-3">
                        {r.eventDate ? (
                          <div>
                            <div className="text-xs font-medium">{r.eventDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                            {r.eventDate >= new Date() && (
                              <div className="text-[10px] text-muted-foreground">
                                J-{Math.ceil((r.eventDate.getTime() - Date.now()) / 86400000)}
                              </div>
                            )}
                          </div>
                        ) : p.event_date_text ? (
                          <span className="text-xs text-muted-foreground italic">{p.event_date_text}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                        <ContractPipeline
                          stages={r.stages}
                          onChange={fetchData}
                          compact
                          onCustomAction={(key) => { if (key === "visio") openVisioPicker(r.event); }}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="text-muted-foreground font-medium">{r.completedCount}/{r.stages.length}</span>
                            <span className="text-muted-foreground">{r.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                r.progress === 100 ? "bg-emerald-500" : "bg-primary",
                              )}
                              style={{ width: `${r.progress}%` }}
                            />
                          </div>
                          {r.nextStage && (
                            <div className="text-[10px] text-muted-foreground truncate" title={r.nextStage.label}>
                              ➜ {r.nextStage.label}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {!r.isArchived && (
                            <>
                              <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-700 h-7 px-2" title="Marquer comme perdu" onClick={() => setLostDialogId(p.id)}>
                                ❌
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 px-2" title="Supprimer" onClick={() => setDeleteDialogId(p.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {r.archiveStatus === "perdu" && (
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" title="Restaurer" onClick={() => handleRestoreFromLost(p.id)}>
                              ↩️ Restaurer
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30 px-6 py-4">
                          {/* Pipeline détaillé géré par EventDossier ci-dessous */}
                          <EventDossier
                            proposal={{
                              id: p.id, client_name: p.client_name, client_email: p.client_email,
                              recipient_name: p.recipient_name, client_id: p.client_id || null, status: p.status,
                              proposal_type: p.proposal_type || "classique",
                              event_date_text: p.event_date_text || null,
                              event_location: p.event_location || null,
                              audience_size: p.audience_size || null,
                              proposal_speakers: (p.proposal_speakers || []).map((ps: any) => ({
                                speaker_id: ps.speaker_id,
                                speaker_fee: ps.speaker_fee, travel_costs: ps.travel_costs,
                                agency_commission: ps.agency_commission, total_price: ps.total_price,
                                speakers: ps.speakers,
                              })),
                            }}
                            onUpdate={fetchData}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 10 && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Afficher</span>
          {([10, 50, 100] as const).map(n => (
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
          <span>· {Math.min(pageSize, filtered.length)} sur {filtered.length}</span>
        </div>
      )}

      {/* Lost dialog */}
      <Dialog open={!!lostDialogId} onOpenChange={(open) => { if (!open) { setLostDialogId(null); setLostReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marquer comme perdu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Raison (optionnel)</Label>
            <Textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} rows={3} className="text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setLostDialogId(null); setLostReason(""); }}>Annuler</Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleMarkLost}>Confirmer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteDialogId} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ce dossier ?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ⚠️ Cette action est <strong className="text-foreground">irréversible</strong>. La proposition, le contrat, les factures, le dossier événement et toutes les données associées seront définitivement supprimés.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteDialogId(null)}>Annuler</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>Supprimer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct contract creation dialog */}
      <Dialog open={directOpen} onOpenChange={setDirectOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0 border-b border-border">
            <DialogTitle className="font-serif">Nouveau contrat direct</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto px-6 py-4 flex-1 min-h-0">
            <p className="text-xs text-muted-foreground">
              Créez un dossier sans proposition préalable. Vous pourrez ensuite finaliser le contrat (lignes, montants, conférencier) dans le dossier.
            </p>

            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => { setDirectClientMode("existing"); setDirectClientName(""); setDirectClientEmail(""); }}
                className={cn("text-xs font-medium px-2 py-1 rounded", directClientMode === "existing" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Client existant
              </button>
              <button
                type="button"
                onClick={() => { setDirectClientMode("new"); setDirectClientId(""); setDirectClientSearch(""); }}
                className={cn("text-xs font-medium px-2 py-1 rounded", directClientMode === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                + Nouveau client
              </button>
            </div>

            {directClientMode === "existing" && (
              <div className="space-y-1">
                <Label className="text-xs">Rechercher un client</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={directClientSearch}
                    onChange={(e) => setDirectClientSearch(e.target.value)}
                    placeholder="Nom de société, contact, email…"
                    className="h-9 text-sm pl-7"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {directClients
                    .filter((c) => {
                      const q = directClientSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        c.company_name.toLowerCase().includes(q) ||
                        (c.contact_name || "").toLowerCase().includes(q) ||
                        (c.email || "").toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 50)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDirectClientId(c.id)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 text-xs hover:bg-accent",
                          directClientId === c.id && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <div>{c.company_name}</div>
                        {(c.contact_name || c.email) && (
                          <div className="text-[10px] text-muted-foreground">
                            {c.contact_name}{c.contact_name && c.email ? " · " : ""}{c.email}
                          </div>
                        )}
                      </button>
                    ))}
                  {directClients.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">Aucun client en base</div>
                  )}
                </div>
              </div>
            )}

            {directClientMode === "new" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nom société *</Label>
                  <Input value={directClientName} onChange={(e) => setDirectClientName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={directClientEmail} onChange={(e) => setDirectClientEmail(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Interlocuteur (optionnel)</Label>
              <Input value={directRecipientName} onChange={(e) => setDirectRecipientName(e.target.value)} className="h-9 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Date événement</Label>
                <Input type="date" value={directEventDate} onChange={(e) => setDirectEventDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Auditoire</Label>
                <Input value={directAudienceSize} onChange={(e) => setDirectAudienceSize(e.target.value)} placeholder="100, 200…" className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Lieu</Label>
              <Input value={directEventLocation} onChange={(e) => setDirectEventLocation(e.target.value)} placeholder="Hôtel, ville…" className="h-9 text-sm" />
            </div>

            {/* Speakers picker */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs font-semibold">
                Conférencier(s) {directSpeakerIds.length > 0 && (
                  <span className="text-muted-foreground font-normal">· {directSpeakerIds.length} sélectionné{directSpeakerIds.length > 1 ? "s" : ""}</span>
                )}
              </Label>
              <p className="text-[10px] text-muted-foreground">Sélectionnez un ou plusieurs conférenciers pour pré-préparer le contrat avec leurs tarifs.</p>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={directSpeakerSearch}
                  onChange={(e) => setDirectSpeakerSearch(e.target.value)}
                  placeholder="Rechercher un conférencier…"
                  className="h-9 text-sm pl-7"
                />
              </div>
              {directSpeakerIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {directSpeakerIds.map((sid) => {
                    const sp = directSpeakers.find((s) => s.id === sid);
                    if (!sp) return null;
                    return (
                      <span key={sid} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded-full">
                        {sp.name}
                        <button type="button" onClick={() => setDirectSpeakerIds((prev) => prev.filter((x) => x !== sid))} className="hover:text-primary/70">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {directSpeakers
                  .filter((s) => {
                    const q = directSpeakerSearch.trim().toLowerCase();
                    if (!q) return true;
                    return s.name.toLowerCase().includes(q);
                  })
                  .slice(0, 50)
                  .map((s) => {
                    const checked = directSpeakerIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setDirectSpeakerIds((prev) => checked ? prev.filter((x) => x !== s.id) : [...prev, s.id])}
                        className={cn(
                          "w-full text-left px-2 py-1.5 text-xs hover:bg-accent flex items-center justify-between gap-2",
                          checked && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {s.base_fee ? `${Number(s.base_fee).toLocaleString("fr-FR")} €` : "—"}
                        </span>
                      </button>
                    );
                  })}
                {directSpeakers.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">Aucun conférencier en base</div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDirectOpen(false)}>Annuler</Button>
              <Button size="sm" onClick={handleCreateDirectContract} disabled={directCreating}>
                {directCreating ? "Création…" : "Créer le dossier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visio quick scheduler */}
      <Dialog open={!!visioDialog} onOpenChange={(open) => !open && setVisioDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2"><Video className="h-4 w-4" /> Planifier la visio préparatoire</DialogTitle>
          </DialogHeader>
          {visioDialog && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={visioDialog.date} onChange={(e) => setVisioDialog({ ...visioDialog, date: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Heure</Label>
                  <Input type="time" value={visioDialog.time} onChange={(e) => setVisioDialog({ ...visioDialog, time: e.target.value })} className="h-9" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Renseigner une date marquera l'étape comme planifiée. Laisser vide réinitialisera l'étape.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setVisioDialog(null)}>Annuler</Button>
                <Button size="sm" onClick={handleSaveVisio} disabled={savingVisio}>{savingVisio ? "Enregistrement…" : "Enregistrer"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventDossiers;
