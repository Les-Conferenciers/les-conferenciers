import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

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
  created_at: string;
};

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground text-sm">{leads.length} lead{leads.length !== 1 ? "s" : ""}</p>
        <Button variant="ghost" size="sm" onClick={fetchLeads} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Thématiques</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Speakers suggérés</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="whitespace-nowrap text-xs">{formatDate(lead.created_at)}</TableCell>
                <TableCell className="whitespace-nowrap font-medium">{lead.first_name} {lead.last_name}</TableCell>
                <TableCell className="text-sm">{lead.email}</TableCell>
                <TableCell className="text-sm">{lead.event_type || "—"}</TableCell>
                <TableCell className="text-sm">{lead.audience_size || "—"}</TableCell>
                <TableCell className="text-sm">{lead.themes?.join(", ") || "—"}</TableCell>
                <TableCell className="text-sm">{lead.objective || "—"}</TableCell>
                <TableCell className="text-sm">{lead.budget || "—"}</TableCell>
                <TableCell className="text-sm">{lead.location || "—"}</TableCell>
                <TableCell className="text-sm">{lead.suggested_speakers?.join(", ") || "—"}</TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                  Aucun lead pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminLeads;
