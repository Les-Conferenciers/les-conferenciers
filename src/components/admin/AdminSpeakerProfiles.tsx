import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "lucide-react";

type Profile = { id: string; slug: string; name: string };
type Row = {
  id: string;
  name: string;
  role: string | null;
  themes: string[] | null;
  image_url: string | null;
  profile_id: string | null;
  archived: boolean | null;
};

const NONE = "__none__";

const AdminSpeakerProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [filterProfile, setFilterProfile] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkProfile, setBulkProfile] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [p, s] = await Promise.all([
      supabase.from("speaker_profiles").select("id, slug, name").order("display_order"),
      supabase.from("speakers").select("id, name, role, themes, image_url, profile_id").eq("archived", false).order("name"),
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (s.data) setRows(s.data as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      const k = r.profile_id || NONE;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterProfile === "none" && r.profile_id) return false;
    if (filterProfile !== "all" && filterProfile !== "none" && r.profile_id !== filterProfile) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !(r.role || "").toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, search, filterProfile]);

  const updateProfile = async (speakerId: string, profileId: string | null) => {
    const { error } = await supabase.from("speakers").update({ profile_id: profileId }).eq("id", speakerId);
    if (error) { toast.error("Échec de la mise à jour"); return; }
    setRows(prev => prev.map(r => r.id === speakerId ? { ...r, profile_id: profileId } : r));
  };

  const applyBulk = async () => {
    if (!bulkProfile || selected.size === 0) return;
    const ids = Array.from(selected);
    const profileId = bulkProfile === NONE ? null : bulkProfile;
    const { error } = await supabase.from("speakers").update({ profile_id: profileId }).in("id", ids);
    if (error) { toast.error("Échec de l'assignation"); return; }
    setRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, profile_id: profileId } : r));
    setSelected(new Set());
    toast.success(`${ids.length} conférencier(s) mis à jour`);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="secondary">Sans profil : {counts.get(NONE) || 0}</Badge>
        {profiles.map(p => (
          <Badge key={p.id} variant="outline">{p.name} : {counts.get(p.id) || 0}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Recherche"
        />
        <Select value={filterProfile} onValueChange={setFilterProfile}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les profils</SelectItem>
            <SelectItem value="none">Sans profil</SelectItem>
            {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selected.size} sélectionné(s)</span>
            <Select value={bulkProfile} onValueChange={setBulkProfile}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Aucun profil</SelectItem>
                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={applyBulk} disabled={!bulkProfile}>Appliquer</Button>
          </div>
        )}
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2 w-10">
                <Checkbox
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-2 w-12"></th>
              <th className="p-2">Nom</th>
              <th className="p-2">Rôle</th>
              <th className="p-2 w-64">Profil</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Chargement…</td></tr>}
            {!loading && filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-2">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={(v) => {
                      const next = new Set(selected);
                      if (v) next.add(r.id); else next.delete(r.id);
                      setSelected(next);
                    }}
                  />
                </td>
                <td className="p-2">
                  {r.image_url ? (
                    <img src={r.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                  )}
                </td>
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2 text-muted-foreground">{r.role}</td>
                <td className="p-2">
                  <Select
                    value={r.profile_id || NONE}
                    onValueChange={(v) => updateProfile(r.id, v === NONE ? null : v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Aucun —</SelectItem>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Aucun conférencier</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSpeakerProfiles;
