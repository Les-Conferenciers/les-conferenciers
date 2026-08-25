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
import { User, Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Profile = { id: string; slug: string; name: string; landing_label?: string | null };
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
  const [includeArchived, setIncludeArchived] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("speakers").select("id, name, role, themes, image_url, profile_id, archived").order("name");
    if (!includeArchived) query = query.eq("archived", false);
    const [p, s] = await Promise.all([
      supabase.from("speaker_profiles").select("id, slug, name, landing_label").order("display_order"),
      query,
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (s.data) setRows(s.data as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [includeArchived]);

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

  const slugify = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/['’]/g, " ")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const reloadProfiles = async () => {
    const { data } = await supabase
      .from("speaker_profiles")
      .select("id, slug, name, landing_label")
      .order("display_order");
    if (data) setProfiles(data as Profile[]);
  };

  const createProfile = async () => {
    const name = newName.trim();
    if (!name) return;
    const slug = slugify(name);
    if (!slug) { toast.error("Nom invalide"); return; }
    if (profiles.some(p => p.slug === slug)) { toast.error("Ce profil existe déjà"); return; }
    setSaving(true);
    const { data: maxRow } = await supabase
      .from("speaker_profiles").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("speaker_profiles").insert({
      slug,
      name,
      landing_label: `Conférenciers ${name.toLowerCase()}`,
      landing_enabled: false,
      display_order: ((maxRow?.display_order as number) ?? 0) + 10,
    });
    setSaving(false);
    if (error) { toast.error(`Échec de la création : ${error.message}`); return; }
    setNewName("");
    await reloadProfiles();
    toast.success(`Profil « ${name} » créé`);
  };

  const renameProfile = async (p: Profile) => {
    const name = editingName.trim();
    if (!name) return;
    setSaving(true);
    const { error } = await supabase
      .from("speaker_profiles")
      .update({ name, landing_label: `Conférenciers ${name.toLowerCase()}` })
      .eq("id", p.id);
    setSaving(false);
    if (error) { toast.error("Échec du renommage"); return; }
    setEditingId(null);
    await reloadProfiles();
    toast.success("Profil renommé");
  };

  const deleteProfile = async (p: Profile) => {
    const { count } = await supabase
      .from("speakers")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", p.id);
    if ((count ?? 0) > 0) {
      toast.error(`${count} conférencier(s) sont rattachés à « ${p.name} ». Réaffecte-les avant de supprimer.`);
      return;
    }
    if (!window.confirm(`Supprimer le profil « ${p.name} » ?`)) return;
    const { error } = await supabase.from("speaker_profiles").delete().eq("id", p.id);
    if (error) { toast.error("Échec de la suppression"); return; }
    await reloadProfiles();
    toast.success("Profil supprimé");
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="secondary">Sans profil : {counts.get(NONE) || 0}</Badge>
        {profiles.map(p => (
          <Badge key={p.id} variant="outline">{p.name} : {counts.get(p.id) || 0}</Badge>
        ))}
        <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={() => setManageOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Gérer les profils
        </Button>
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

        <div className="flex items-center gap-2">
          <Switch id="inc-arch" checked={includeArchived} onCheckedChange={setIncludeArchived} />
          <Label htmlFor="inc-arch" className="text-sm cursor-pointer">Inclure les archivés</Label>
        </div>

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
                <td className="p-2 font-medium">
                  {r.name}
                  {r.archived && <span className="ml-2 inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Archivé</span>}
                </td>
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

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gérer les profils</DialogTitle>
          </DialogHeader>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Nom du nouveau profil</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createProfile(); } }}
              />
            </div>
            <Button onClick={createProfile} disabled={saving || !newName.trim()} className="gap-1.5">
              <Plus className="h-4 w-4" /> Créer
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            L'URL et le libellé de la page sont générés automatiquement. La page publique reste désactivée tant que tu ne l'actives pas dans « Pages profils ».
          </p>

          <div className="max-h-[50vh] overflow-y-auto divide-y border rounded-md">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2">
                {editingId === p.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className="flex-1 h-8"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); renameProfile(p); } }}
                    />
                    <Button size="sm" onClick={() => renameProfile(p)} disabled={saving}>OK</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuler</Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">/{p.slug} — {counts.get(p.id) || 0} conférencier(s)</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingId(p.id); setEditingName(p.name); }}
                      title="Renommer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteProfile(p)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSpeakerProfiles;
