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
  const [lostDialogId, setLostDialogId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  // Direct contract creation (without prior proposal)
  const [directOpen, setDirectOpen] = useState(false);
  const [directClients, setDirectClients] = useState<Array<{ id: string; company_name: string; contact_name: string | null; email: string | null }>>([]);
  const [directClientId, setDirectClientId] = useState("");
  const [directClientName, setDirectClientName] = useState("");
  const [directClientEmail, setDirectClientEmail] = useState("");
  const [directRecipientName, setDirectRecipientName] = useState("");
  const [directEventDate, setDirectEventDate] = useState("");
  const [directEventLocation, setDirectEventLocation] = useState("");
  const [directAudienceSize, setDirectAudienceSize] = useState("");
  const [directCreating, setDirectCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes, iRes, eRes] = await Promise.all([
      supabase.from("proposals").select("*, proposal_speakers(speaker_id, speaker_fee, travel_costs, agency_commission, total_price, display_order, selected_conference_ids, speakers(name, image_url, formal_address, email, phone))").eq("status", "accepted").order("created_at", { ascending: false }),
      supabase.from("contracts").select("id, proposal_id, status, signed_at, client_signed_received_at, event_date").order("created_at", { ascending: false }),
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
    const { data } = await supabase.from("clients").select("id, company_name, contact_name, email").order("company_name");
    setDirectClients((data as any) || []);
    setDirectClientId("");
    setDirectClientName("");
    setDirectClientEmail("");
    setDirectRecipientName("");
    setDirectEventDate("");
    setDirectEventLocation("");
    setDirectAudienceSize("");
    setDirectOpen(true);
  };

  const handleCreateDirectContract = async () => {
    const clientName = directClientId
      ? (directClients.find((c) => c.id === directClientId)?.company_name || "")
      : directClientName.trim();
    const clientEmail = directClientId
      ? (directClients.find((c) => c.id === directClientId)?.email || "")
      : directClientEmail.trim();
    const recipient = directRecipientName.trim()
      || (directClientId ? directClients.find((c) => c.id === directClientId)?.contact_name || "" : "");

    if (!clientName) { toast.error("Sélectionnez ou saisissez un client"); return; }
    if (!clientEmail) { toast.error("Email du client requis"); return; }

    setDirectCreating(true);
    try {
      // 1) Create accepted "direct" proposal (placeholder shell)
      const { data: prop, error: pErr } = await supabase.from("proposals").insert({
        client_name: clientName,
        client_email: clientEmail,
        recipient_name: recipient || null,
        client_id: directClientId || null,
        status: "accepted",
        accepted_at: new Date().toISOString(),
        proposal_type: "direct",
        event_location: directEventLocation || null,
        event_date_text: directEventDate || null,
        audience_size: directAudienceSize || null,
        message: "Contrat créé directement (sans proposition).",
      } as any).select("id").single();
      if (pErr || !prop) throw pErr || new Error("create proposal failed");

      // 2) Create event shell
      await supabase.from("events").insert({
        proposal_id: prop.id,
        event_date: directEventDate || null,
        audience_size: directAudienceSize || null,
      } as any);

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
      const clientSigned = pContract?.client_signed_received_at || pContract?.signed_at || null;
      const clientDepositPaid = pEvent?.client_deposit_paid_at || acompte?.paid_at || null;
      const invoiceSentClient = pEvent?.client_invoice_sent_at || finalInvoice?.sent_at || null;
      const invoicePaidClient = pEvent?.client_invoice_paid_at || finalInvoice?.paid_at || null;

      // Speaker-side dates
      const speakerSigned = pEvent?.speaker_signed_contract_at || null;
      const speakerDepositPaid = pEvent?.speaker_deposit_paid_at || null;
      const speakerPaid = pEvent?.speaker_paid_at || null;

      // Visio
      const visioDate = pEvent?.visio_date || null;

      // Liaison
      const liaisonSent = pEvent?.liaison_sheet_sent_at || null;

      // Event date for sorting/display
      const eventDateRaw = pEvent?.event_date || pContract?.event_date || null;
      const eventDate = eventDateRaw ? new Date(eventDateRaw + (eventDateRaw.length === 10 ? "T12:00:00" : "")) : null;

      // BDC
      const bdc = pEvent?.bdc_number || null;

      // Status
      const allInvoicesPaid = pInvoices.length > 0 && pInvoices.every((i) => i.status === "paid");
      const isLost = !!p.lost_at;
      const isWon = allInvoicesPaid && !!speakerPaid && !isLost;
      const archiveStatus: "gagne" | "perdu" | null = isLost ? "perdu" : (isWon ? "gagne" : null);

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
        archiveStatus,
        isArchived: !!archiveStatus,
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
        <h2 className="text-lg font-serif font-bold">Dossiers événement</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={openDirectContract}>
            <FilePlus className="h-3.5 w-3.5" /> Nouveau contrat direct
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
        <div className="border border-border rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Client</TableHead>
                <TableHead className="whitespace-nowrap">Date événement</TableHead>
                <TableHead className="text-center" title="Contrat signé par le client">Contrat client</TableHead>
                <TableHead className="text-center" title="Contrat signé par le conférencier">Contrat speaker</TableHead>
                <TableHead className="whitespace-nowrap" title="Acompte versé par le client">Acpte client</TableHead>
                <TableHead className="whitespace-nowrap" title="Acompte versé au conférencier">Acpte speaker</TableHead>
                <TableHead className="whitespace-nowrap" title="Date de visio préparatoire">Visio</TableHead>
                <TableHead className="text-center" title="Envoi feuille de liaison">Liaison</TableHead>
                <TableHead className="text-center" title="Envoi facture client">Facture env.</TableHead>
                <TableHead className="text-center" title="Règlement facture par le client">Facture payée</TableHead>
                <TableHead className="text-center" title="Règlement de la facture au conférencier">Speaker payé</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const p = r.proposal;
                const isExpanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{p.client_name}</div>
                        {r.bdc && <div className="text-[10px] text-muted-foreground">BDC {r.bdc}</div>}
                        {r.archiveStatus === "perdu" && <div className="text-[10px] text-orange-600 mt-0.5">❌ Perdu</div>}
                        {r.archiveStatus === "gagne" && <div className="text-[10px] text-emerald-600 mt-0.5">🏆 Gagné</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.eventDate ? (
                          <span className="text-xs font-medium">{r.eventDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        ) : p.event_date_text ? (
                          <span className="text-xs text-muted-foreground italic">{p.event_date_text}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center"><Bool value={!!r.clientSigned} date={r.clientSigned} /></TableCell>
                      <TableCell className="text-center"><Bool value={!!r.speakerSigned} date={r.speakerSigned} /></TableCell>
                      <TableCell><DateCell value={r.clientDepositPaid} /></TableCell>
                      <TableCell><DateCell value={r.speakerDepositPaid} /></TableCell>
                      <TableCell><DateCell value={r.visioDate} /></TableCell>
                      <TableCell className="text-center"><Bool value={!!r.liaisonSent} date={r.liaisonSent} /></TableCell>
                      <TableCell className="text-center"><Bool value={!!r.invoiceSentClient} date={r.invoiceSentClient} /></TableCell>
                      <TableCell className="text-center"><Bool value={!!r.invoicePaidClient} date={r.invoicePaidClient} /></TableCell>
                      <TableCell className="text-center"><Bool value={!!r.speakerPaid} date={r.speakerPaid} /></TableCell>
                      <TableCell className="text-right">
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
                        <TableCell colSpan={12} className="bg-muted/30 px-6 py-2">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Nouveau contrat direct</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Créez un dossier sans proposition préalable. Vous pourrez ensuite finaliser le contrat (lignes, montants, conférencier) dans le dossier.
            </p>

            <div className="space-y-1">
              <Label className="text-xs">Client (CRM)</Label>
              <Select value={directClientId} onValueChange={setDirectClientId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="— Sélectionner ou laisser vide pour saisir manuellement —" /></SelectTrigger>
                <SelectContent>
                  {directClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}{c.contact_name ? ` — ${c.contact_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!directClientId && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nom client / société</Label>
                  <Input value={directClientName} onChange={(e) => setDirectClientName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email client</Label>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDirectOpen(false)}>Annuler</Button>
              <Button size="sm" onClick={handleCreateDirectContract} disabled={directCreating}>
                {directCreating ? "Création…" : "Créer le dossier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventDossiers;
