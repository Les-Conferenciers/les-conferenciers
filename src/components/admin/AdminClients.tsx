import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone, ExternalLink, FileText, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  siret: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type ProposalDetail = {
  id: string;
  token: string;
  client_name: string;
  client_email: string;
  client_id: string | null;
  proposal_type: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  event_date_text: string | null;
  event_location: string | null;
  audience_size: string | null;
  proposal_speakers: { speakers: { name: string } | null }[];
  contracts: { id: string; status: string; signed_at: string | null }[];
};

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<ProposalDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "prospect" | "client">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [siret, setSiret] = useState("");
  const [notes, setNotes] = useState("");
  const [formStatus, setFormStatus] = useState("prospect");

  useEffect(() => {
    fetchClients();
    fetchProposals();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("company_name");
    setClients((data as any) || []);
    setLoading(false);
  };

  const fetchProposals = async () => {
    const { data } = await supabase
      .from("proposals")
      .select("id, token, client_name, client_email, client_id, proposal_type, status, created_at, sent_at, accepted_at, event_date_text, event_location, audience_size, proposal_speakers(speakers(name)), contracts(id, status, signed_at)")
      .order("created_at", { ascending: false });
    setProposals((data as any) || []);
  };

  const resetForm = () => {
    setCompanyName(""); setContactName(""); setEmail(""); setPhone("");
    setAddress(""); setCity(""); setSiret(""); setNotes(""); setFormStatus("prospect");
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (c: Client) => {
    setEditing(c);
    setCompanyName(c.company_name);
    setContactName(c.contact_name || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setCity(c.city || "");
    setSiret(c.siret || "");
    setNotes(c.notes || "");
    setFormStatus(c.status || "prospect");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!companyName) { toast.error("Nom de la société requis"); return; }
    const payload = {
      company_name: companyName,
      contact_name: contactName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      siret: siret || null,
      notes: notes || null,
      status: formStatus,
    };
    if (editing) {
      const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erreur"); return; }
      toast.success("Client mis à jour");
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) { toast.error("Erreur création"); return; }
      toast.success("Client créé");
    }
    setDialogOpen(false);
    resetForm();
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    await supabase.from("clients").delete().eq("id", id);
    toast.success("Client supprimé");
    fetchClients();
  };

  const getClientProposals = (client: Client): ProposalDetail[] => {
    return proposals.filter(p =>
      p.client_id === client.id ||
      (client.email && p.client_email?.toLowerCase() === client.email.toLowerCase())
    );
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      c.company_name.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const proposalTypeLabel = (t: string) => {
    const map: Record<string, string> = { classique: "📋 Classique", unique: "🎤 Unique", info: "📝 Infos" };
    return map[t] || t;
  };

  const getLifecycleStage = (p: ProposalDetail): { label: string; cls: string; icon: string } => {
    const contract = p.contracts?.[0];
    if (contract?.signed_at) return { label: "Contrat signé", cls: "bg-emerald-100 text-emerald-800", icon: "✅" };
    if (contract) return { label: "Contrat envoyé", cls: "bg-teal-100 text-teal-700", icon: "📝" };
    if (p.accepted_at) return { label: "Acceptée", cls: "bg-green-100 text-green-700", icon: "🤝" };
    if (p.status === "sent") return { label: "Envoyée", cls: "bg-amber-100 text-amber-700", icon: "📤" };
    if (p.status === "archived") return { label: "Archivée", cls: "bg-muted text-muted-foreground", icon: "📁" };
    return { label: "Brouillon", cls: "bg-muted text-muted-foreground", icon: "✏️" };
  };

  const clientStatusBadge = (status: string) => {
    if (status === "client") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Client</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Prospect</span>;
  };

  const siteOrigin = "https://www.lesconferenciers.com";

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="prospect">Prospects</option>
            <option value="client">Clients</option>
          </select>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau client
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Société</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Propositions</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => {
              const clientProposals = getClientProposals(c);
              const isExpanded = expandedId === c.id;
              return (
                <>
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <TableCell className="w-8 px-2">
                      {clientProposals.length > 0 ? (
                        isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{c.company_name}</div>
                          {c.siret && <div className="text-[10px] text-muted-foreground">SIRET: {c.siret}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.contact_name || "—"}</TableCell>
                    <TableCell>
                      {c.email ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {c.email}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {c.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {c.phone}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{c.city || "—"}</TableCell>
                    <TableCell>
                      {clientProposals.length > 0 ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{clientProposals.length}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{clientStatusBadge(c.status || "prospect")}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded proposals history */}
                  {isExpanded && (
                    <TableRow key={`${c.id}-history`}>
                      <TableCell colSpan={9} className="bg-muted/30 p-0">
                        <div className="px-6 py-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Historique des propositions — {c.company_name}
                          </h4>
                          {c.notes && (
                            <p className="text-xs text-muted-foreground mb-3 italic border-l-2 border-primary/30 pl-3">{c.notes}</p>
                          )}
                          {clientProposals.length > 0 ? (
                            <div className="space-y-2">
                              {clientProposals.map(p => {
                                const stage = getLifecycleStage(p);
                                const speakerNames = (p.proposal_speakers || [])
                                  .map((ps: any) => ps.speakers?.name)
                                  .filter(Boolean);
                                const proposalLink = `${siteOrigin}/proposition/${p.token}`;
                                return (
                                  <div key={p.id} className="flex items-center gap-3 bg-background rounded-lg px-4 py-3 border border-border/50">
                                    <div className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                                      {formatDate(p.created_at)}
                                    </div>
                                    <div className="text-xs shrink-0">
                                      {proposalTypeLabel(p.proposal_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {speakerNames.length > 0 ? (
                                        <span className="text-sm truncate block">
                                          {speakerNames.slice(0, 3).join(", ")}
                                          {speakerNames.length > 3 && <span className="text-muted-foreground"> +{speakerNames.length - 3}</span>}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground italic">Demande d'infos</span>
                                      )}
                                      {(p.event_date_text || p.event_location) && (
                                        <span className="text-[11px] text-muted-foreground block">
                                          {[p.event_date_text, p.event_location].filter(Boolean).join(" · ")}
                                          {p.audience_size && ` · ${p.audience_size} pers.`}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 ${stage.cls}`}>
                                      {stage.icon} {stage.label}
                                    </span>
                                    {p.sent_at && (
                                      <span className="text-[10px] text-muted-foreground shrink-0">
                                        Envoyée le {formatDate(p.sent_at)}
                                      </span>
                                    )}
                                    {p.proposal_type !== "info" && (
                                      <a
                                        href={proposalLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-primary hover:text-primary/80"
                                        onClick={e => e.stopPropagation()}
                                        title="Voir la proposition"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Aucune proposition envoyée à ce client.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  {search ? "Aucun client trouvé" : "Aucun client. Créez votre premier contact !"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Société *</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="SNCF" />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <select
                  className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                >
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@societe.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 XX XX XX XX" />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="12 rue de..." />
            </div>
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input value={siret} onChange={e => setSiret(e.target.value)} placeholder="848 829 743 00014" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notes internes..." />
            </div>
            <Button className="w-full" onClick={handleSave}>
              {editing ? "Enregistrer" : "Créer le client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;
