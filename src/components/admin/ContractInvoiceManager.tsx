import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Receipt, Plus, ExternalLink, Send, CheckCircle, Printer,
} from "lucide-react";
import { toast } from "sonner";

type Proposal = {
  id: string;
  client_name: string;
  client_email: string;
  recipient_name: string | null;
  status: string;
  proposal_speakers: {
    speaker_fee: number | null;
    travel_costs: number | null;
    agency_commission: number | null;
    total_price: number | null;
    speakers: { name: string } | null;
  }[];
};

type Contract = {
  id: string;
  proposal_id: string;
  event_date: string | null;
  event_location: string | null;
  event_time: string | null;
  event_format: string | null;
  event_description: string | null;
  status: string;
  created_at: string;
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

type Props = {
  proposal: Proposal;
  onUpdate: () => void;
};

const ContractInvoiceManager = ({ proposal, onUpdate }: Props) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Contract form
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventFormat, setEventFormat] = useState("Conférence");
  const [eventDescription, setEventDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Invoice form
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"acompte" | "solde" | "total">("total");
  const [dueDate, setDueDate] = useState("");
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    fetchData();
  }, [proposal.id]);

  const fetchData = async () => {
    setLoading(true);
    const [contractRes, invoicesRes] = await Promise.all([
      supabase.from("contracts").select("*").eq("proposal_id", proposal.id).maybeSingle(),
      supabase.from("invoices").select("*").eq("proposal_id", proposal.id).order("created_at"),
    ]);
    setContract(contractRes.data as any);
    setInvoices((invoicesRes.data as any) || []);
    setLoading(false);
  };

  const totalHT = proposal.proposal_speakers.reduce((sum, s) => sum + (s.total_price || 0), 0);

  const handleCreateContract = async () => {
    setSaving(true);
    const { error } = await supabase.from("contracts").insert({
      proposal_id: proposal.id,
      event_date: eventDate || null,
      event_location: eventLocation || null,
      event_time: eventTime || null,
      event_format: eventFormat || null,
      event_description: eventDescription || null,
    });
    if (error) {
      toast.error("Erreur création contrat");
      console.error(error);
    } else {
      toast.success("Contrat créé !");
      setContractDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleCreateInvoice = async () => {
    setCreatingInvoice(true);
    const multiplier = invoiceType === "total" ? 1 : 0.5;
    const amountHT = totalHT * multiplier;
    const tvaRate = 20;
    const amountTTC = amountHT * (1 + tvaRate / 100);

    const { error } = await supabase.from("invoices").insert({
      proposal_id: proposal.id,
      contract_id: contract?.id || null,
      invoice_number: "", // trigger will auto-generate
      invoice_type: invoiceType,
      amount_ht: Math.round(amountHT * 100) / 100,
      tva_rate: tvaRate,
      amount_ttc: Math.round(amountTTC * 100) / 100,
      due_date: dueDate || null,
    });
    if (error) {
      toast.error("Erreur création facture");
      console.error(error);
    } else {
      toast.success("Facture créée !");
      setInvoiceDialogOpen(false);
      setDueDate("");
      fetchData();
    }
    setCreatingInvoice(false);
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoice_id: invoice.id },
      });
      if (error) throw error;
      await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice.id);
      toast.success(`Facture ${invoice.invoice_number} envoyée !`);
      fetchData();
    } catch {
      toast.error("Erreur d'envoi");
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoice.id);
    toast.success(`Facture ${invoice.invoice_number} marquée payée`);
    fetchData();
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) return <div className="text-muted-foreground text-xs py-2">Chargement…</div>;

  return (
    <div className="space-y-4 mt-4 border-t border-border pt-4">
      {/* ─── Contract ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contrat
        </h3>
        {!contract ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setContractDialogOpen(true)}>
            <Plus className="h-3 w-3" /> Créer le contrat
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${contract.status === "signed" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {contract.status === "signed" ? "Signé" : "Brouillon"}
            </span>
            <Button size="sm" variant="ghost" asChild>
              <a href={`/admin/contrat/${contract.id}`} target="_blank" rel="noopener noreferrer" className="gap-1">
                <Printer className="h-3 w-3" /> Voir
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Contract creation dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Créer le contrat — {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date de l'événement</Label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horaires</Label>
                <Input placeholder="14h00 - 15h30" value={eventTime} onChange={e => setEventTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lieu</Label>
              <Input placeholder="Hôtel Marriott, Paris" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <Input placeholder="Conférence, Table ronde, Atelier..." value={eventFormat} onChange={e => setEventFormat(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Détails / remarques</Label>
              <Textarea placeholder="Informations complémentaires..." value={eventDescription} onChange={e => setEventDescription(e.target.value)} rows={2} />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              Total prestation : <span className="font-semibold text-foreground">{totalHT.toLocaleString("fr-FR")} € HT</span>
              {" "}— {(totalHT * 1.2).toLocaleString("fr-FR")} € TTC
            </div>
            <Button className="w-full" onClick={handleCreateContract} disabled={saving}>
              {saving ? "Création…" : "Créer le contrat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">N°</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs text-right">Montant TTC</TableHead>
              <TableHead className="text-xs">Échéance</TableHead>
              <TableHead className="text-xs">Statut</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="text-xs font-mono">{inv.invoice_number}</TableCell>
                <TableCell className="text-xs capitalize">{inv.invoice_type}</TableCell>
                <TableCell className="text-xs text-right font-medium">{inv.amount_ttc.toLocaleString("fr-FR")} €</TableCell>
                <TableCell className="text-xs">{formatDate(inv.due_date)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inv.status === "paid" ? "bg-green-100 text-green-700" :
                    inv.status === "sent" ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {inv.status === "paid" ? "Payée" : inv.status === "sent" ? "Envoyée" : "Brouillon"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" asChild title="Voir la facture">
                      <a href={`/admin/facture/${inv.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                    {inv.status === "draft" && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleSendInvoice(inv)}>
                        <Send className="h-3 w-3" /> Envoyer
                      </Button>
                    )}
                    {inv.status !== "paid" && (
                      <Button size="sm" variant="ghost" className="gap-1 text-xs text-green-600" onClick={() => handleMarkPaid(inv)}>
                        <CheckCircle className="h-3 w-3" /> Payée
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {invoices.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">Aucune facture créée</p>
      )}

      {/* Invoice creation dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Créer une facture — {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs">Type de facture</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["acompte", "solde", "total"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setInvoiceType(t)}
                    className={`px-3 py-2 rounded-lg border text-sm capitalize transition-colors ${
                      invoiceType === t ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {t === "acompte" ? "Acompte 50%" : t === "solde" ? "Solde 50%" : "Total 100%"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date d'échéance</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span>{(totalHT * (invoiceType === "total" ? 1 : 0.5)).toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA 20%</span>
                <span>{(totalHT * (invoiceType === "total" ? 1 : 0.5) * 0.2).toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total TTC</span>
                <span>{(totalHT * (invoiceType === "total" ? 1 : 0.5) * 1.2).toLocaleString("fr-FR")} €</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleCreateInvoice} disabled={creatingInvoice}>
              {creatingInvoice ? "Création…" : "Créer la facture"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractInvoiceManager;
