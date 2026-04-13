import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCw, ChevronLeft, ChevronRight, EyeOff, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hideTest, setHideTest] = useState(true);

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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const isTestLead = (lead: Lead) =>
    lead.first_name?.toLowerCase().includes("test quotidien") ||
    lead.last_name?.toLowerCase().includes("test quotidien") ||
    lead.email?.toLowerCase().includes("test quotidien") ||
    lead.company?.toLowerCase().includes("test quotidien") ||
    lead.additional_info?.toLowerCase().includes("[test quotidien]");

  const filteredLeads = hideTest ? leads.filter(l => !isTestLead(l)) : leads;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const testCount = leads.filter(isTestLead).length;

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
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Thématiques</TableHead>
              <TableHead>Message / Objectif</TableHead>
              <TableHead>Speakers suggérés</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedLeads.map((lead) => (
              <TableRow key={lead.id}>
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
                <TableCell className="text-sm">{lead.event_type || "—"}</TableCell>
                <TableCell className="text-sm">{lead.themes?.join(", ") || "—"}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{lead.additional_info || lead.objective || "—"}</TableCell>
                <TableCell className="text-sm">{lead.suggested_speakers?.join(", ") || "—"}</TableCell>
              </TableRow>
            ))}
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
    </div>
  );
};

export default AdminLeads;
