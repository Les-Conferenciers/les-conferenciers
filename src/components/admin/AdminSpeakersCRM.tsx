import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, X, MapPin, Euro, RefreshCw, ExternalLink, Upload, Pencil, Save, Globe, Video, ImageIcon, Wand2, Sparkles, Archive, ArchiveRestore, Trash2, Star, Plus, MessageSquare } from "lucide-react";
import { parseThemes } from "@/lib/parseThemes";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";

type Speaker = {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  themes: string[] | null;
  image_url: string | null;
  biography: string | null;
  specialty: string | null;
  base_fee: number | null;
  city: string | null;
  languages: string[] | null;
  video_url: string | null;
  featured: boolean | null;
  gender: string | null;
  archived: boolean | null;
  created_at: string;
};

type Review = {
  id: string;
  speaker_id: string;
  author_name: string;
  author_title: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

const DEFAULT_IMAGE = "https://www.lesconferenciers.com/wp-content/uploads/2022/05/thierry-marx-portrait.png";

const AdminSpeakersCRM = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [feeFilter, setFeeFilter] = useState<"all" | "set" | "unset">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [importing, setImporting] = useState(false);
  const [migratingPhotos, setMigratingPhotos] = useState(false);
  const [formattingBios, setFormattingBios] = useState(false);
  const [generatingSpecialties, setGeneratingSpecialties] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editSpeaker, setEditSpeaker] = useState<Speaker | null>(null);
  const [editForm, setEditForm] = useState<Partial<Speaker>>({});
  const [saving, setSaving] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState({ author_name: "", author_title: "", rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-speakers-from-csv`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: text,
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Import terminé : ${data.updated} mis à jour, ${data.conferencesInserted} conférences`);
      if (data.notFound?.length > 0) {
        toast.info(`${data.notFound.length} non trouvés`);
      }
      fetchSpeakers();
    } catch (err: any) {
      toast.error(`Erreur import : ${err.message}`);
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchSpeakers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("speakers")
      .select("id, name, slug, role, themes, image_url, biography, specialty, base_fee, city, languages, video_url, featured, gender, archived, created_at")
      .order("name");
    setSpeakers(data || []);
    setLoading(false);
  };

  const fetchReviews = async (speakerId: string) => {
    setLoadingReviews(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("speaker_id", speakerId)
      .order("created_at", { ascending: false });
    setReviews((data as Review[]) || []);
    setLoadingReviews(false);
  };

  useEffect(() => { fetchSpeakers(); }, []);

  useEffect(() => {
    if (editSpeaker) {
      fetchReviews(editSpeaker.id);
      setShowReviewForm(false);
      setNewReview({ author_name: "", author_title: "", rating: 5, comment: "" });
    }
  }, [editSpeaker?.id]);

  const allThemes = useMemo(() => {
    const themeSet = new Set<string>();
    speakers.forEach(s => parseThemes(s.themes).forEach(t => themeSet.add(t)));
    return Array.from(themeSet).sort();
  }, [speakers]);

  const allCities = useMemo(() => {
    const citySet = new Set<string>();
    speakers.forEach(s => { if (s.city) citySet.add(s.city); });
    return Array.from(citySet).sort();
  }, [speakers]);

  const filteredSpeakers = useMemo(() => {
    return speakers.filter(s => {
      // Filter archived
      if (!showArchived && s.archived) return false;
      if (showArchived && !s.archived) return false;

      if (search) {
        const q = search.toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(q);
        const themeMatch = parseThemes(s.themes).some(t => t.toLowerCase().includes(q));
        if (!nameMatch && !themeMatch) return false;
      }
      if (themeFilter) {
        const speakerThemes = parseThemes(s.themes);
        if (!speakerThemes.includes(themeFilter)) return false;
      }
      if (cityFilter && s.city !== cityFilter) return false;
      if (feeFilter === "set" && !s.base_fee) return false;
      if (feeFilter === "unset" && s.base_fee) return false;
      return true;
    });
  }, [speakers, search, themeFilter, cityFilter, feeFilter, showArchived]);

  const clearFilters = () => {
    setSearch("");
    setThemeFilter("");
    setCityFilter("");
    setFeeFilter("all");
  };

  const hasFilters = search || themeFilter || cityFilter || feeFilter !== "all";

  // Edit handlers
  const openEdit = (speaker: Speaker) => {
    setEditSpeaker(speaker);
    setEditForm({
      name: speaker.name,
      role: speaker.role,
      specialty: speaker.specialty,
      city: speaker.city,
      base_fee: speaker.base_fee,
      biography: speaker.biography,
      image_url: speaker.image_url,
      video_url: speaker.video_url,
      themes: speaker.themes,
      languages: speaker.languages,
      featured: speaker.featured,
      gender: speaker.gender,
    });
  };

  const handleSave = async () => {
    if (!editSpeaker) return;
    setSaving(true);
    const { error } = await supabase
      .from("speakers")
      .update({
        name: editForm.name,
        role: editForm.role || null,
        specialty: editForm.specialty || null,
        city: editForm.city || null,
        base_fee: editForm.base_fee || null,
        biography: editForm.biography || null,
        image_url: editForm.image_url || null,
        video_url: editForm.video_url || null,
        themes: editForm.themes || [],
        languages: editForm.languages || [],
        featured: editForm.featured ?? false,
        gender: editForm.gender || 'male',
      } as any)
      .eq("id", editSpeaker.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur de sauvegarde");
      return;
    }
    toast.success("Conférencier mis à jour");
    setEditSpeaker(null);
    fetchSpeakers();
  };

  const handleArchive = async (speaker: Speaker) => {
    const newVal = !speaker.archived;
    const { error } = await supabase.from("speakers").update({ archived: newVal } as any).eq("id", speaker.id);
    if (error) { toast.error("Erreur"); return; }
    toast.success(newVal ? "Fiche archivée" : "Fiche restaurée");
    fetchSpeakers();
    if (editSpeaker?.id === speaker.id) setEditSpeaker(null);
  };

  const handleDelete = async (speaker: Speaker) => {
    // Delete conferences first
    await supabase.from("speaker_conferences").delete().eq("speaker_id", speaker.id);
    await supabase.from("reviews").delete().eq("speaker_id", speaker.id);
    const { error } = await supabase.from("speakers").delete().eq("id", speaker.id);
    if (error) { toast.error("Erreur de suppression"); return; }
    toast.success("Fiche supprimée définitivement");
    setEditSpeaker(null);
    fetchSpeakers();
  };

  const handleAddReview = async () => {
    if (!editSpeaker || !newReview.author_name || !newReview.comment) return;
    const { error } = await supabase.from("reviews").insert({
      speaker_id: editSpeaker.id,
      author_name: newReview.author_name,
      author_title: newReview.author_title || null,
      rating: newReview.rating,
      comment: newReview.comment,
    } as any);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Avis ajouté");
    setNewReview({ author_name: "", author_title: "", rating: 5, comment: "" });
    setShowReviewForm(false);
    fetchReviews(editSpeaker.id);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Avis supprimé");
    if (editSpeaker) fetchReviews(editSpeaker.id);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-grow min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou thématique…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={fetchSpeakers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <Button variant="outline" size="sm" className="gap-1.5" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> {importing ? "Import…" : "Importer CSV"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={migratingPhotos} onClick={async () => {
            setMigratingPhotos(true);
            try {
              const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/migrate-speaker-photos`;
              const resp = await fetch(url, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
              });
              const data = await resp.json();
              toast.success(`Photos migrées : ${data.summary?.migrated ?? 0} OK, ${data.summary?.failed ?? 0} erreurs`);
              fetchSpeakers();
            } catch (err: any) {
              toast.error(`Erreur migration : ${err.message}`);
            }
            setMigratingPhotos(false);
          }}>
            <ImageIcon className="h-4 w-4" /> {migratingPhotos ? "Migration…" : "Migrer photos"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={formattingBios} onClick={async () => {
            setFormattingBios(true);
            try {
              const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/format-biographies`;
              const resp = await fetch(url, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
              });
              const data = await resp.json();
              toast.success(`Bios formatées : ${data.summary?.formatted ?? 0} traitées`);
              fetchSpeakers();
            } catch (err: any) {
              toast.error(`Erreur : ${err.message}`);
            }
            setFormattingBios(false);
          }}>
            <Wand2 className="h-4 w-4" /> {formattingBios ? "Formatage…" : "Formater bios"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={generatingSpecialties} onClick={async () => {
            setGeneratingSpecialties(true);
            try {
              const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-specialties`;
              const resp = await fetch(url, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
              });
              const data = await resp.json();
              toast.success(`Spécialités générées : ${data.summary?.generated ?? 0} traitées`);
              fetchSpeakers();
            } catch (err: any) {
              toast.error(`Erreur : ${err.message}`);
            }
            setGeneratingSpecialties(false);
          }}>
            <Sparkles className="h-4 w-4" /> {generatingSpecialties ? "Génération…" : "Générer spécialités"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${showArchived ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-background text-foreground border-input"}`}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? "Archivés" : "Actifs"}
          </button>

          {/* Theme dropdown */}
          <select
            className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={themeFilter}
            onChange={e => setThemeFilter(e.target.value)}
          >
            <option value="">Toutes les thématiques</option>
            {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* City dropdown */}
          <select
            className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
          >
            <option value="">Toutes les villes</option>
            {allCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Fee filter */}
          <select
            className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={feeFilter}
            onChange={e => setFeeFilter(e.target.value as any)}
          >
            <option value="all">Tarif : tous</option>
            <option value="set">Tarif renseigné</option>
            <option value="unset">Tarif non renseigné</option>
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          )}

          <span className="text-sm text-muted-foreground ml-auto">
            {filteredSpeakers.length} conférencier{filteredSpeakers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Speaker list as table-like rows */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {filteredSpeakers.map(speaker => {
          const themes = parseThemes(speaker.themes);
          const imageUrl = speaker.image_url && speaker.image_url !== "/placeholder.svg" ? speaker.image_url : DEFAULT_IMAGE;

          return (
            <div
              key={speaker.id}
              className={`flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors cursor-pointer group ${speaker.archived ? "opacity-60" : ""}`}
              onClick={() => openEdit(speaker)}
            >
              <img src={imageUrl} alt={speaker.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{speaker.name}</span>
                  {speaker.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground font-medium">★</span>}
                  {speaker.archived && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">Archivé</span>}
                </div>
                {speaker.role && <p className="text-xs text-muted-foreground truncate">{speaker.role}</p>}
              </div>
              <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-xs text-muted-foreground">
                {themes.length > 0 && (
                  <span className="truncate max-w-[200px]">{themes.slice(0, 2).join(", ")}{themes.length > 2 ? ` +${themes.length - 2}` : ""}</span>
                )}
                {speaker.city && (
                  <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="h-3 w-3" />{speaker.city}</span>
                )}
                {speaker.base_fee ? (
                  <span className="font-semibold text-foreground whitespace-nowrap">{speaker.base_fee.toLocaleString("fr-FR")} €</span>
                ) : (
                  <span className="italic text-muted-foreground/50 whitespace-nowrap">—</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); handleArchive(speaker); }} title={speaker.archived ? "Restaurer" : "Archiver"}>
                  {speaker.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); openEdit(speaker); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <a href={`/speakers/${speaker.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="h-8 w-8 flex items-center justify-center">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-accent transition-colors" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSpeakers.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-12">Aucun conférencier ne correspond à vos critères.</div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editSpeaker} onOpenChange={open => { if (!open) setEditSpeaker(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Modifier le conférencier</DialogTitle>
          </DialogHeader>
          {editSpeaker && (
            <div className="space-y-5 mt-2">
              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <img
                  src={editForm.image_url || DEFAULT_IMAGE}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-grow space-y-1">
                  <Label className="text-xs text-muted-foreground">URL de la photo</Label>
                  <Input value={editForm.image_url || ""} onChange={e => setEditForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://…" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <Input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Rôle / Titre</Label>
                  <Input value={editForm.role || ""} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Expert en IA" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Spécialité (affichée sur la carte)</Label>
                <Input value={editForm.specialty || ""} onChange={e => setEditForm(p => ({ ...p, specialty: e.target.value }))} placeholder="Ex: Chef Étoilé et Homme d'Affaires" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ville</Label>
                  <Input value={editForm.city || ""} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} placeholder="Paris" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cachet de base (€)</Label>
                  <Input type="number" value={editForm.base_fee ?? ""} onChange={e => setEditForm(p => ({ ...p, base_fee: e.target.value ? Number(e.target.value) : null }))} placeholder="3000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Langues (séparées par des virgules)</Label>
                  <Input
                    value={(editForm.languages || []).join(", ")}
                    onChange={e => setEditForm(p => ({ ...p, languages: e.target.value.split(",").map(l => l.trim()).filter(Boolean) }))}
                    placeholder="Français, Anglais"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3" /> URL vidéo</Label>
                  <Input value={editForm.video_url || ""} onChange={e => setEditForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/…" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Thématiques (séparées par des virgules)</Label>
                <Input
                  value={(editForm.themes || []).join(", ")}
                  onChange={e => setEditForm(p => ({ ...p, themes: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))}
                  placeholder="Intelligence artificielle, Innovation, Leadership"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Biographie</Label>
                <RichTextEditor
                  value={editForm.biography || ""}
                  onChange={(val) => setEditForm(p => ({ ...p, biography: val }))}
                  placeholder="Biographie du conférencier…"
                  minHeight="250px"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.featured ?? false}
                    onChange={e => setEditForm(p => ({ ...p, featured: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Mis en avant (featured)</span>
                </label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Genre</Label>
                  <select
                    className="rounded-lg border border-input bg-background text-foreground px-3 py-1.5 text-sm"
                    value={editForm.gender || "male"}
                    onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                  </select>
                </div>
              </div>

              {/* Reviews section */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Avis clients ({reviews.length})
                  </Label>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowReviewForm(!showReviewForm)}>
                    <Plus className="h-3.5 w-3.5" /> Ajouter un avis
                  </Button>
                </div>

                {showReviewForm && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nom</Label>
                        <Input value={newReview.author_name} onChange={e => setNewReview(p => ({ ...p, author_name: e.target.value }))} placeholder="Christophe MAUFOUX" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Poste / Entreprise</Label>
                        <Input value={newReview.author_title} onChange={e => setNewReview(p => ({ ...p, author_title: e.target.value }))} placeholder="Directeur Délégué Ineo Infracom (ENGIE Ineo)" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Note</Label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button" onClick={() => setNewReview(p => ({ ...p, rating: s }))}>
                            <Star className={`h-5 w-5 ${s <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Commentaire</Label>
                      <Textarea value={newReview.comment} onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))} placeholder="Témoignage du client…" rows={3} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddReview} disabled={!newReview.author_name || !newReview.comment}>Ajouter</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                {loadingReviews ? (
                  <p className="text-xs text-muted-foreground">Chargement…</p>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucun avis pour ce conférencier.</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {reviews.map(r => (
                      <div key={r.id} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg text-sm">
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{r.author_name}</span>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />)}
                            </div>
                          </div>
                          {r.author_title && <p className="text-xs text-muted-foreground">{r.author_title}</p>}
                          {r.comment && <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{r.comment}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleDeleteReview(r.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center gap-2 pt-2 border-t border-border">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-orange-600" onClick={() => handleArchive(editSpeaker)}>
                    {editSpeaker.archived ? <><ArchiveRestore className="h-3.5 w-3.5" /> Restaurer</> : <><Archive className="h-3.5 w-3.5" /> Archiver</>}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {editSpeaker.name} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. La fiche, les conférences et les avis associés seront définitivement supprimés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(editSpeaker)} className="bg-destructive text-destructive-foreground">
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditSpeaker(null)}>Annuler</Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" /> {saving ? "Sauvegarde…" : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSpeakersCRM;
