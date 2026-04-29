import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, ChevronLeft, ChevronRight, EyeOff, Eye, Mail, Trash2, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  event_type: string | null;
  audience_size: string | null;
  themes: string[] | null;
  objective: string | null;
  budget: string | null;
  location: string | null;
  additional_info: string | null;
  suggested_speakers: string[] | null;
  lead_type: string;
  company: string | null;
  phone: string | null;
  event_date: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const formatEventDate = (val: string | null) => {
  if (!val) return "—";
  // Try parse as ISO
  const d = new Date(val);
  if (!isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(val)) {
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }
  return val;
};

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hideTest, setHideTest] = useState(true);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("simulator_leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const isTestLead = (lead: Lead) => {
    const full = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    return full.includes("test") && full.includes("quotidien") ||
      lead.email?.toLowerCase().includes("test@lesconferenciers") ||
      lead.company?.toLowerCase() === "test automatique" ||
      lead.additional_info?.toLowerCase().includes("test automatique quotidien");
  };

  const filteredLeads = hideTest ? leads.filter(l => !isTestLead(l)) : leads;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const testCount = leads.filter(isTestLead).length;

  const getMessageSnippet = (lead: Lead) => lead.additional_info || lead.objective || "";

  const handleDelete = async (lead: Lead) => {
    const { error } = await supabase.from("simulator_leads").delete().eq("id", lead.id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Lead supprimé");
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    if (detailLead?.id === lead.id) setDetailLead(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm">{filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}</p>
          {testCount > 0 && (
            <Button
              variant={hideTest ? "outline" : "secondary"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => { setHideTest(prev => !prev); setPage(1); }}
            >
              {hideTest ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hideTest ? `Afficher les tests (${testCount})` : "Masquer les tests"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{currentPage} / {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date reçu</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Date événement</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedLeads.map((lead) => {
              const snippet = getMessageSnippet(lead);
              return (
                <TableRow key={lead.id} className="cursor-pointer" onClick={() => setDetailLead(lead)}>
                  <TableCell className="whitespace-nowrap text-xs">{formatDate(lead.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={lead.lead_type === "Contact" ? "default" : "secondary"} className="text-xs">
                      {lead.lead_type || "Simulateur"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{lead.first_name} {lead.last_name}</TableCell>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell className="text-sm">{lead.company || "—"}</TableCell>
                  <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatEventDate(lead.event_date)}</TableCell>
                  <TableCell className="text-sm">{lead.event_type || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[260px]">
                    <span className="block truncate text-muted-foreground">{snippet || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); setDetailLead(lead); }}
                      >
                        <Mail className="h-3.5 w-3.5" /> Détail
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est définitive. Le lead « {lead.first_name} {lead.last_name} » ({lead.email}) sera supprimé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(lead)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {pagedLeads.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                  Aucun lead pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
          </Button>
          <span>Page {currentPage} sur {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
            Suivant <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Détail lead */}
      <Dialog open={!!detailLead} onOpenChange={(open) => !open && setDetailLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {detailLead?.first_name} {detailLead?.last_name}
            </DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={detailLead.lead_type === "Contact" ? "default" : "secondary"} className="text-xs">
                  {detailLead.lead_type || "Simulateur"}
                </Badge>
                <span className="text-xs text-muted-foreground">Reçu le {formatDate(detailLead.created_at)}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-muted/30 rounded-lg p-3">
                <div><span className="text-muted-foreground text-xs">Email :</span><br /><a href={`mailto:${detailLead.email}`} className="text-primary hover:underline">{detailLead.email}</a></div>
                <div><span className="text-muted-foreground text-xs">Téléphone :</span><br />{detailLead.phone || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Entreprise :</span><br />{detailLead.company || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Lieu :</span><br />{detailLead.location || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Date événement :</span><br />{formatEventDate(detailLead.event_date)}</div>
                <div><span className="text-muted-foreground text-xs">Type d'événement :</span><br />{detailLead.event_type || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Auditoire :</span><br />{detailLead.audience_size || "—"}</div>
                <div><span className="text-muted-foreground text-xs">Budget :</span><br />{detailLead.budget || "—"}</div>
              </div>

              {detailLead.themes && detailLead.themes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Thématiques</p>
                  <div className="flex flex-wrap gap-1">
                    {detailLead.themes.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                </div>
              )}

              {detailLead.objective && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Objectif</p>
                  <p className="text-sm whitespace-pre-wrap">{detailLead.objective}</p>
                </div>
              )}

              {detailLead.additional_info && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Message du client</p>
                  <div className="border border-border rounded-md p-3 bg-background whitespace-pre-wrap text-sm leading-relaxed">
                    {detailLead.additional_info}
                  </div>
                </div>
              )}

              {detailLead.suggested_speakers && detailLead.suggested_speakers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Speakers suggérés (par le simulateur)</p>
                  <p className="text-sm">{detailLead.suggested_speakers.join(", ")}</p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border">
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={`mailto:${detailLead.email}?subject=Votre demande - Les Conférenciers`}>
                    <Mail className="h-3.5 w-3.5" /> Répondre par email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
