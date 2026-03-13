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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Receipt, Plus, ExternalLink, Send, CheckCircle, Printer, Pencil, Ban, CircleDollarSign, Trash2, Percent,
} from "lucide-react";
import { toast } from "sonner";

type Proposal = {
  id: string;
  client_name: string;
  client_email: string;
  recipient_name: string | null;
  status: string;
  proposal_speakers: {
    id?: string;
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

type ContractLine = {
  id: string;
  label: string;
  amount_ht: number;
  tva_rate: number;
  type: "speaker" | "travel" | "custom";
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

const ContractInvoiceManager = ({ proposal, onUpdate }: Props) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Contract form
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventFormat, setEventFormat] = useState("Conférence");
  const [eventDescription, setEventDescription] = useState("");
  const [contractLines, setContractLines] = useState<ContractLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [saving, setSaving] = useState(false);

  // Contract email
  const [contractEmailOpen, setContractEmailOpen] = useState(false);
  const [contractEmailSubject, setContractEmailSubject] = useState("");
  const [contractEmailBody, setContractEmailBody] = useState("");
  const [sendingContract, setSendingContract] = useState(false);

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

  // ─── Compute totals from contract lines ───
  const computeTotals = (lines: ContractLine[], discount: number) => {
    const subtotalHT = lines.reduce((sum, l) => sum + l.amount_ht, 0);
    const discountAmount = subtotalHT * (discount / 100);
    const totalHTAfterDiscount = subtotalHT - discountAmount;
    // Weighted TVA calculation
    const totalTVA = lines.reduce((sum, l) => {
      const lineShare = subtotalHT > 0 ? l.amount_ht / subtotalHT : 0;
      const lineHTAfterDiscount = l.amount_ht - (discountAmount * lineShare);
      return sum + lineHTAfterDiscount * (l.tva_rate / 100);
    }, 0);
    const totalTTC = totalHTAfterDiscount + totalTVA;
    return { subtotalHT, discountAmount, totalHTAfterDiscount, totalTVA, totalTTC };
  };

  // Use contract lines if stored, otherwise fallback to proposal speakers
  const getEffectiveLines = (): ContractLine[] => {
    if (contract?.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0) {
      return contract.contract_lines as ContractLine[];
    }
    return proposal.proposal_speakers.map((ps, i) => ({
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

  const speakerSummary = effectiveLines
    .filter(l => l.type === "speaker")
    .map(l => l.label)
    .join(", ") || proposal.proposal_speakers.map(s => s.speakers?.name || "—").join(", ");

  // ─── Contract lines helpers ───
  const buildInitialLines = (): ContractLine[] => {
    if (contract?.contract_lines && Array.isArray(contract.contract_lines) && contract.contract_lines.length > 0) {
      return contract.contract_lines as ContractLine[];
    }
    return proposal.proposal_speakers.map((ps, i) => ({
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

  const removeLine = (id: string) => {
    setContractLines(prev => prev.filter(l => l.id !== id));
  };

  const addLine = (type: ContractLine["type"]) => {
    const defaults: Record<string, string> = {
      speaker: "Conférencier",
      travel: "Frais de déplacement",
      custom: "Prestation complémentaire",
    };
    setContractLines(prev => [...prev, {
      id: generateId(),
      label: defaults[type],
      amount_ht: 0,
      tva_rate: 20,
      type,
    }]);
  };

  // ─── Contract ───

  const openCreateContract = () => {
    setEditingContract(false);
    setEventDate("");
    setEventLocation("");
    setEventTime("");
    setEventFormat("Conférence");
    setEventDescription("");
    setContractLines(buildInitialLines());
    setDiscountPercent(0);
    setContractDialogOpen(true);
  };

  const openEditContract = () => {
    if (!contract) return;
    setEditingContract(true);
    setEventDate(contract.event_date || "");
    setEventLocation(contract.event_location || "");
    setEventTime(contract.event_time || "");
    setEventFormat(contract.event_format || "Conférence");
    setEventDescription(contract.event_description || "");
    setContractLines(buildInitialLines());
    setDiscountPercent(contract.discount_percent || 0);
    setContractDialogOpen(true);
  };

  const handleSaveContract = async () => {
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

    if (editingContract && contract) {
      const { error } = await supabase.from("contracts").update(payload as any).eq("id", contract.id);
      if (error) { toast.error("Erreur mise à jour"); } else { toast.success("Contrat mis à jour !"); }
    } else {
      const { error } = await supabase.from("contracts").insert({
        proposal_id: proposal.id,
        ...payload,
      } as any);
      if (error) { toast.error("Erreur création contrat"); console.error(error); } else { toast.success("Contrat créé !"); }
    }
    setContractDialogOpen(false);
    fetchData();
    setSaving(false);
  };

  const openContractEmail = () => {
    if (!contract) return;
    const lines = getEffectiveLines();
    const disc = contract.discount_percent || 0;
    const totals = computeTotals(lines, disc);
    const dateStr = contract.event_date ? new Date(contract.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "à définir";
    setContractEmailSubject(`Contrat de prestation — ${proposal.client_name} — Les Conférenciers`);
    setContractEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Suite à votre accord, je vous transmets le contrat de prestation pour votre événement.

📋 Récapitulatif :
• Conférencier(s) : ${speakerSummary}
• Date : ${dateStr}
• Lieu : ${contract.event_location || "à définir"}
• Montant total TTC : ${totals.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €${disc > 0 ? ` (remise ${disc}% incluse)` : ""}

👉 Cliquez sur le bouton ci-dessous pour consulter le contrat et le signer électroniquement. Il vous suffira de renseigner votre nom complet et de cocher la case d'acceptation.

N'hésitez pas à me contacter pour toute question.

Bien cordialement,
Nelly Sabde — Les Conférenciers`);
    setContractEmailOpen(true);
  };

  const handleSendContractEmail = async () => {
    if (!contract) return;
    setSendingContract(true);
    try {
      const { error } = await supabase.functions.invoke("send-contract-email", {
        body: {
          contract_id: contract.id,
          email_subject: contractEmailSubject,
          email_body: contractEmailBody,
        },
      });
      if (error) throw error;
      await supabase.from("contracts").update({ status: "sent" } as any).eq("id", contract.id);
      toast.success("Contrat envoyé par email !");
      setContractEmailOpen(false);
      fetchData();
      onUpdate();
    } catch {
      toast.error("Erreur d'envoi du contrat");
    }
    setSendingContract(false);
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

  const openEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditAmountHT(inv.amount_ht);
    setEditTvaRate(inv.tva_rate);
    setEditDueDate(inv.due_date || "");
    setEditInvoiceOpen(true);
  };

  const handleSaveInvoice = async () => {
    if (!editingInvoice) return;
    const amountTTC = editAmountHT * (1 + editTvaRate / 100);
    const { error } = await supabase.from("invoices").update({
      amount_ht: Math.round(editAmountHT * 100) / 100,
      tva_rate: editTvaRate,
      amount_ttc: Math.round(amountTTC * 100) / 100,
      due_date: editDueDate || null,
    }).eq("id", editingInvoice.id);
    if (error) { toast.error("Erreur"); } else { toast.success("Facture mise à jour !"); }
    setEditInvoiceOpen(false);
    fetchData();
  };

  const openInvoiceEmail = (inv: Invoice) => {
    setEmailInvoice(inv);
    const typeLabel = inv.invoice_type === "acompte" ? "d'acompte" : inv.invoice_type === "solde" ? "de solde" : "";
    setInvoiceEmailSubject(`Facture ${typeLabel} ${inv.invoice_number} — ${proposal.client_name}`);
    setInvoiceEmailBody(`Bonjour${proposal.recipient_name ? ` ${proposal.recipient_name.split(" ")[0]}` : ""},

Veuillez trouver ci-dessous votre facture ${typeLabel} pour la prestation de conférence.

📄 Facture n° ${inv.invoice_number}
• Conférencier(s) : ${speakerSummary}
• Montant HT : ${inv.amount_ht.toLocaleString("fr-FR")} €
• TVA ${inv.tva_rate}% : ${(inv.amount_ttc - inv.amount_ht).toLocaleString("fr-FR")} €
• Montant TTC : ${inv.amount_ttc.toLocaleString("fr-FR")} €
${inv.due_date ? `• Échéance : ${new Date(inv.due_date).toLocaleDateString("fr-FR")}` : ""}

👉 Cliquez sur le bouton ci-dessous pour consulter et télécharger votre facture.

Bien cordialement,
Nelly Sabde — Les Conférenciers`);
    setInvoiceEmailOpen(true);
  };

  const handleSendInvoiceEmail = async () => {
    if (!emailInvoice) return;
    setSendingInvoice(true);
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoice_id: emailInvoice.id,
          email_subject: invoiceEmailSubject,
          email_body: invoiceEmailBody,
        },
      });
      if (error) throw error;
      await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", emailInvoice.id);
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

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const getContractSignUrl = () =>
    contract?.token ? `${window.location.origin}/signer-contrat/${contract.token}` : null;

  // Totals for contract dialog (live)
  const dialogTotals = computeTotals(contractLines, discountPercent);

  if (loading) return <div className="text-muted-foreground text-xs py-2">Chargement…</div>;

  return (
    <div className="space-y-4 mt-4 border-t border-border pt-4">
      {/* ─── Contract ─── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contrat
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
                <Button size="sm" variant="ghost" onClick={openEditContract} title="Éditer">
                  <Pencil className="h-3 w-3" />
                </Button>
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

      {/* Contract form dialog */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingContract ? "Modifier" : "Créer"} le contrat — {proposal.client_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Event details */}
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

            {/* ─── Editable line items ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Lignes de facturation</Label>
              </div>

              {contractLines.map((line) => (
                <div key={line.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        line.type === "speaker" ? "bg-primary/10 text-primary" :
                        line.type === "travel" ? "bg-blue-100 text-blue-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {line.type === "speaker" ? "Conférencier" : line.type === "travel" ? "Déplacement" : "Autre"}
                      </span>
                    </div>
                    <Input
                      value={line.label}
                      onChange={e => updateLine(line.id, "label", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Libellé"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Montant HT (€)</Label>
                        <Input
                          type="number"
                          value={line.amount_ht}
                          onChange={e => updateLine(line.id, "amount_ht", Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">TVA</Label>
                        <Select value={String(line.tva_rate)} onValueChange={v => updateLine(line.id, "tva_rate", Number(v))}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TVA_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive mt-6" onClick={() => removeLine(line.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Add line buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addLine("speaker")}>
                  <Plus className="h-3 w-3" /> Conférencier
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addLine("travel")}>
                  <Plus className="h-3 w-3" /> Frais de déplacement
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addLine("custom")}>
                  <Plus className="h-3 w-3" /> Autre prestation
                </Button>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <Label className="text-xs">Remise globale (%)</Label>
                <p className="text-[10px] text-muted-foreground">Facultatif — sera déduite du sous-total HT</p>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                className="w-20 h-8 text-sm text-right"
              />
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
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
                <span>Total HT{discountPercent > 0 ? " après remise" : ""}</span>
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

            <Button className="w-full" onClick={handleSaveContract} disabled={saving}>
              {saving ? "Sauvegarde…" : editingContract ? "Mettre à jour le contrat" : "Créer le contrat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract email dialog */}
      <Dialog open={contractEmailOpen} onOpenChange={setContractEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Envoyer le contrat — {proposal.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Objet</Label>
              <Input value={contractEmailSubject} onChange={e => setContractEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Corps du mail</Label>
              <Textarea value={contractEmailBody} onChange={e => setContractEmailBody(e.target.value)} rows={12} className="text-sm" />
              <p className="text-[10px] text-muted-foreground">Le bouton « Consulter et signer le contrat » est ajouté automatiquement.</p>
            </div>
            <Button className="w-full" onClick={handleSendContractEmail} disabled={sendingContract}>
              <Send className="h-4 w-4 mr-2" />
              {sendingContract ? "Envoi en cours…" : "Envoyer le contrat par email"}
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
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className={`border rounded-lg p-4 ${
              inv.status === "paid" ? "border-green-200 bg-green-50/50" :
              inv.status === "sent" ? "border-amber-200 bg-amber-50/30" :
              "border-border"
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
                      <CircleDollarSign className="h-3 w-3" /> En attente de paiement
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      Brouillon
                    </span>
                  )}
                  {inv.due_date && inv.status !== "paid" && (
                    <span className="text-[10px] text-muted-foreground">Échéance : {formatDate(inv.due_date)}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {inv.status === "draft" && (
                    <Button size="sm" variant="ghost" onClick={() => openEditInvoice(inv)} title="Éditer">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild title="Voir la facture">
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
                      className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleMarkPaid(inv)}
                    >
                      <CheckCircle className="h-3 w-3" /> Marquer payée
                    </Button>
                  )}
                  {inv.status === "paid" && (
                    <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground" onClick={() => handleMarkUnpaid(inv)} title="Annuler le paiement">
                      <Ban className="h-3 w-3" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
                <span>{(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA 20%</span>
                <span>{(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5) * 0.2).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
              </div>
              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground italic">
                  <span>Remise {effectiveDiscount}% déjà appliquée</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total TTC</span>
                <span>{(totalHTAfterDiscount * (invoiceType === "total" ? 1 : 0.5) * 1.2).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
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
            <DialogTitle className="font-serif">Modifier la facture {editingInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Montant HT (€)</Label>
                <Input type="number" value={editAmountHT} onChange={e => setEditAmountHT(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">TVA (%)</Label>
                <Input type="number" value={editTvaRate} onChange={e => setEditTvaRate(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date d'échéance</Label>
              <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm flex justify-between font-bold">
              <span>Total TTC</span>
              <span>{(editAmountHT * (1 + editTvaRate / 100)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
            </div>
            <Button className="w-full" onClick={handleSaveInvoice}>
              Enregistrer les modifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice email dialog */}
      <Dialog open={invoiceEmailOpen} onOpenChange={setInvoiceEmailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Envoyer la facture {emailInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Objet</Label>
              <Input value={invoiceEmailSubject} onChange={e => setInvoiceEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Corps du mail</Label>
              <Textarea value={invoiceEmailBody} onChange={e => setInvoiceEmailBody(e.target.value)} rows={12} className="text-sm" />
              <p className="text-[10px] text-muted-foreground">Le bouton « Consulter la facture » et les coordonnées bancaires sont ajoutés automatiquement.</p>
            </div>
            <Button className="w-full" onClick={handleSendInvoiceEmail} disabled={sendingInvoice}>
              <Send className="h-4 w-4 mr-2" />
              {sendingInvoice ? "Envoi en cours…" : "Envoyer la facture par email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractInvoiceManager;
