import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2, AlertCircle, CheckCircle, Globe, ExternalLink, Save, Eye, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";

type ImportedProfile = {
  name: string;
  slug: string;
  role: string | null;
  specialty: string | null;
  biography: string | null;
  themes: string[];
  conferences: { title: string; description: string }[];
  languages: string[];
  gender: string;
  key_points: string[];
  why_expertise: string | null;
  why_impact: string | null;
  photo_url: string | null;
  video_url: string | null;
  sources: { source: string; found: boolean; photo_url: string | null }[];
};

const AdminSpeakerImport = () => {
  const [searchName, setSearchName] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ImportedProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Editable fields
  const [editForm, setEditForm] = useState<ImportedProfile | null>(null);

  const handleSearch = async () => {
    if (!searchName.trim() || searchName.trim().length < 2) {
      toast.error("Entrez un nom valide (min 2 caractères)");
      return;
    }
    setSearching(true);
    setError(null);
    setProfile(null);
    setEditForm(null);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-competitor-speakers`;
      const session = await supabase.auth.getSession();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ name: searchName.trim() }),
      });

      const data = await resp.json();

      if (!data.success) {
        setError(data.error || "Erreur inconnue");
        return;
      }

      setProfile(data.profile);
      setEditForm({ ...data.profile });
    } catch (err: any) {
      setError(`Erreur réseau : ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handlePublish = async () => {
    if (!editForm) return;
    setPublishing(true);

    try {
      // Call edge function to publish (handles image migration server-side)
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-speaker`;
      const session = await supabase.auth.getSession();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          profile: {
            name: editForm.name,
            slug: editForm.slug,
            role: editForm.role,
            specialty: editForm.specialty,
            biography: editForm.biography,
            themes: editForm.themes,
            languages: editForm.languages,
            gender: editForm.gender,
            key_points: editForm.key_points,
            why_expertise: (editForm as any).why_expertise,
            why_impact: (editForm as any).why_impact,
            photo_url: editForm.photo_url,
            video_url: editForm.video_url,
          },
          conferences: editForm.conferences,
        }),
      });

      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Erreur de publication");

      toast.success(`${editForm.name} a été ajouté avec succès !`);
      setProfile(null);
      setEditForm(null);
      setSearchName("");

      toast.success(`${editForm.name} a été ajouté avec succès !`);
      setProfile(null);
      setEditForm(null);
      setSearchName("");
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const updateConference = (idx: number, field: "title" | "description", value: string) => {
    if (!editForm) return;
    const confs = [...editForm.conferences];
    confs[idx] = { ...confs[idx], [field]: value };
    setEditForm({ ...editForm, conferences: confs });
  };

  const addConference = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      conferences: [...editForm.conferences, { title: "", description: "" }],
    });
  };

  const removeConference = (idx: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      conferences: editForm.conferences.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <h3 className="font-serif text-lg font-bold mb-1">Importer un conférencier</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Recherchez un conférencier par nom et importez sa fiche automatiquement.
        </p>

        <div className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du conférencier (ex: Bertrand Piccard)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching} className="gap-2 min-w-[140px]">
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Rechercher
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="border border-destructive/30 rounded-xl p-4 bg-destructive/5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">{error}</p>
            {error.includes("concurrents") && (
              <p className="text-xs text-muted-foreground mt-1">
                Essayez avec une orthographe différente ou un nom plus complet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {profile && editForm && (
        <div className="space-y-4">
          {/* Sources found */}
          <div className="flex flex-wrap gap-2">
            {profile.sources.map((src) => (
              <div
                key={src.source}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  src.found
                    ? "bg-accent/10 text-accent-foreground border border-accent/30"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {src.found ? (
                  <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                <Globe className="h-3 w-3" />
                {src.source}
              </div>
            ))}
          </div>

          {/* Profile card */}
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Header with photo */}
            <div className="bg-primary/5 p-6 flex items-start gap-6">
              {editForm.photo_url && (
                <img
                  src={editForm.photo_url}
                  alt={editForm.name}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-md"
                />
              )}
              <div className="flex-grow min-w-0">
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="font-bold text-lg"
                    />
                    <Input
                      value={editForm.role || ""}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      placeholder="Rôle / Titre"
                    />
                    <Input
                      value={editForm.specialty || ""}
                      onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                      placeholder="Spécialité courte (pour la carte)"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-serif font-bold text-foreground">{editForm.name}</h2>
                    {editForm.role && (
                      <p className="text-sm text-muted-foreground mt-1">{editForm.role}</p>
                    )}
                    {editForm.specialty && (
                      <p className="text-xs italic text-muted-foreground/80 mt-0.5">{editForm.specialty}</p>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant={editing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditing(!editing)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editing ? "Aperçu" : "Modifier"}
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Themes */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Thématiques</Label>
                {editing ? (
                  <Input
                    value={editForm.themes.join(", ")}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        themes: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Thème 1, Thème 2, ..."
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {editForm.themes.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Languages & Gender */}
              {editing && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Langues</Label>
                    <Input
                      value={editForm.languages.join(", ")}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          languages: e.target.value.split(",").map((l) => l.trim()).filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Genre</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    >
                      <option value="male">Masculin</option>
                      <option value="female">Féminin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">URL Vidéo</Label>
                    <Input
                      value={editForm.video_url || ""}
                      onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              )}

              {/* Photo URL */}
              {editing && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">URL de la photo</Label>
                  <Input
                    value={editForm.photo_url || ""}
                    onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Biography */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Biographie</Label>
                {editing ? (
                  <RichTextEditor
                    value={editForm.biography || ""}
                    onChange={(val) => setEditForm({ ...editForm, biography: val })}
                    placeholder="Biographie du conférencier…"
                    minHeight="200px"
                  />
                ) : (
                  <div
                    className="text-sm leading-relaxed prose prose-sm max-w-none [&_strong]:text-foreground [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: editForm.biography || "<p class='text-muted-foreground italic'>Aucune biographie</p>" }}
                  />
                )}
              </div>

              {/* Conferences */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  Conférences ({editForm.conferences.length})
                </Label>
                {editForm.conferences.map((conf, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 space-y-2">
                    {editing ? (
                      <>
                        <div className="flex gap-2">
                          <Input
                            value={conf.title}
                            onChange={(e) => updateConference(idx, "title", e.target.value)}
                            placeholder="Titre de la conférence"
                            className="font-medium"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeConference(idx)}
                            className="text-destructive hover:text-destructive"
                          >
                            ✕
                          </Button>
                        </div>
                        <RichTextEditor
                          value={conf.description}
                          onChange={(val) => updateConference(idx, "description", val)}
                          placeholder="Description de la conférence…"
                          minHeight="100px"
                        />
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-sm">{conf.title || "Sans titre"}</h4>
                        {conf.description && (
                          <div
                            className="text-xs text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: conf.description }}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
                {editing && (
                  <Button variant="outline" size="sm" onClick={addConference} className="w-full">
                    + Ajouter une conférence
                  </Button>
                )}
              </div>

              {/* Key points */}
              {editForm.key_points.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Points forts</Label>
                  {editing ? (
                    <Input
                      value={editForm.key_points.join(", ")}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          key_points: e.target.value.split(",").map((p) => p.trim()).filter(Boolean),
                        })
                      }
                    />
                  ) : (
                    <ul className="grid grid-cols-2 gap-1.5">
                      {editForm.key_points.map((kp, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          {kp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border p-4 flex justify-between items-center bg-muted/30">
              <a
                href={`/conferencier/${editForm.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Prévisualiser la fiche (après publication)
              </a>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProfile(null);
                    setEditForm(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="gap-2"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Publication…
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Publier la fiche
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searching && !error && !profile && (
        <div className="text-center py-16 text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Tapez le nom d'un conférencier pour lancer la recherche</p>
          <p className="text-xs mt-1 opacity-60">
            Les sites Orators, WeChamp et Simone & Nelson seront analysés automatiquement
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSpeakerImport;
