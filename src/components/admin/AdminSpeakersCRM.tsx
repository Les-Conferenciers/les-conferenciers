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
import { Search, X, MapPin, RefreshCw, ExternalLink, Pencil, Save, Globe, Video, Archive, ArchiveRestore, Trash2, Star, Plus, MessageSquare, UserPlus, Loader2, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, Mic, Eye, EyeOff, User } from "lucide-react";
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
  fee_details: string | null;
  city: string | null;
  languages: string[] | null;
  video_url: string | null;
  featured: boolean | null;
  gender: string | null;
  archived: boolean | null;
  created_at: string;
  why_expertise: string | null;
  why_impact: string | null;
  phone: string | null;
  email: string | null;
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

type Conference = {
  id: string;
  speaker_id: string;
  title: string;
  description: string | null;
  bullet_points: string[] | null;
  bonus: string | null;
  display_order: number | null;
};



// Helper: extract last name for sorting
const getLastName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

const AdminSpeakersCRM = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [feeFilter, setFeeFilter] = useState<"all" | "set" | "unset">("all");
  const [feeMinFilter, setFeeMinFilter] = useState<string>("");
  const [feeMaxFilter, setFeeMaxFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [profileFilter, setProfileFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "online" | "offline">("all");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "base_fee">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Import state
  const [importName, setImportName] = useState("");
  const [importSearching, setImportSearching] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Manual creation state
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "", specialty: "", city: "", base_fee: "" as string, fee_details: "",
    phone: "", email: "", gender: "male", themes: "", languages: "Français",
    biography: "", archived: false,
  });
  const [creatingManual, setCreatingManual] = useState(false);

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ processed: 0, total: 0, current: "" });
  const [showEnrichLog, setShowEnrichLog] = useState(false);
  const [enrichLog, setEnrichLog] = useState<string[]>([]);
  
  // Single speaker enrichment
  const [enrichingSingle, setEnrichingSingle] = useState(false);
  const [enrichUrl, setEnrichUrl] = useState("");
  const [showEnrichSingle, setShowEnrichSingle] = useState(false);

  // Edit dialog state
  const [editSpeaker, setEditSpeaker] = useState<Speaker | null>(null);
  const [editForm, setEditForm] = useState<Partial<Speaker>>({});
  const [saving, setSaving] = useState(false);

  // AI regeneration state
  const [regenerating, setRegenerating] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState({ author_name: "", author_title: "", rating: 5, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Conferences state
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loadingConferences, setLoadingConferences] = useState(false);
  const [newConference, setNewConference] = useState({ title: "", description: "" });
  const [showAddConference, setShowAddConference] = useState(false);
  const [regeneratingConf, setRegeneratingConf] = useState<string | null>(null);
  const [editingConfId, setEditingConfId] = useState<string | null>(null);
  const [editConfForm, setEditConfForm] = useState<{ title: string; description: string }>({ title: "", description: "" });
  const [generatingAiConf, setGeneratingAiConf] = useState(false);
  const [regeneratingConfTitle, setRegeneratingConfTitle] = useState<string | null>(null);

  const fetchSpeakers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("speakers")
      .select("id, name, slug, role, themes, image_url, biography, specialty, base_fee, fee_details, city, languages, video_url, featured, gender, archived, created_at, why_expertise, why_impact, phone, email")
      .order("name");
    setSpeakers((data as any) || []);
    setLoading(false);
  };

  const fetchConferences = async (speakerId: string) => {
    setLoadingConferences(true);
    const { data } = await supabase
      .from("speaker_conferences")
      .select("*")
      .eq("speaker_id", speakerId)
      .order("display_order");
    setConferences((data as Conference[]) || []);
    setLoadingConferences(false);
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
      fetchConferences(editSpeaker.id);
      setShowReviewForm(false);
      setShowAddConference(false);
      setEditingConfId(null);
      setNewReview({ author_name: "", author_title: "", rating: 5, comment: "" });
      setNewConference({ title: "", description: "" });
      setShowEnrichSingle(false);
      setEnrichUrl("");
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

  const PROFILE_TYPES = [
    "Ancien du GIGN", "Artiste", "Astronaute", "Chef cuisinier", "Chef d'orchestre",
    "Conférencier illusionniste", "Économiste", "Entrepreneur", "Explorateur",
    "Journaliste", "Médecin", "Militaire", "Patrouille de France", "Philosophe",
    "Scientifique", "Sportif",
  ];

  const filteredSpeakers = useMemo(() => {
    const filtered = speakers.filter(s => {
      // Visibility filter
      if (visibilityFilter === "online" && s.archived) return false;
      if (visibilityFilter === "offline" && !s.archived) return false;
      // Legacy archived toggle (when visibilityFilter is "all")
      if (visibilityFilter === "all") {
        if (!showArchived && s.archived) return false;
        if (showArchived && !s.archived) return false;
      }
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
      if (feeMinFilter) {
        const min = Number(feeMinFilter);
        if (!isNaN(min) && (!s.base_fee || s.base_fee < min)) return false;
      }
      if (feeMaxFilter) {
        const max = Number(feeMaxFilter);
        if (!isNaN(max) && (!s.base_fee || s.base_fee > max)) return false;
      }
      if (genderFilter !== "all" && s.gender !== genderFilter) return false;
      if (profileFilter) {
        const q = profileFilter.toLowerCase();
        const roleMatch = (s.role || "").toLowerCase().includes(q) || (s.specialty || "").toLowerCase().includes(q);
        const bioMatch = (s.biography || "").toLowerCase().includes(q);
        if (!roleMatch && !bioMatch) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") {
        // Sort by last name
        const aLast = getLastName(a.name).toLowerCase();
        const bLast = getLastName(b.name).toLowerCase();
        return aLast.localeCompare(bLast, "fr") * dir;
      }
      if (sortBy === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      if (sortBy === "base_fee") {
        const aFee = a.base_fee ?? (sortDir === "asc" ? Infinity : -Infinity);
        const bFee = b.base_fee ?? (sortDir === "asc" ? Infinity : -Infinity);
        return (aFee - bFee) * dir;
      }
      return 0;
    });
  }, [speakers, search, themeFilter, cityFilter, feeFilter, feeMinFilter, feeMaxFilter, genderFilter, profileFilter, showArchived, visibilityFilter, sortBy, sortDir]);

  const clearFilters = () => {
    setSearch(""); setThemeFilter(""); setCityFilter(""); setFeeFilter("all"); setFeeMinFilter(""); setFeeMaxFilter(""); setGenderFilter("all"); setProfileFilter(""); setVisibilityFilter("all");
  };
  const hasFilters = search || themeFilter || cityFilter || feeFilter !== "all" || feeMinFilter || feeMaxFilter || genderFilter !== "all" || profileFilter || visibilityFilter !== "all";

  // Edit handlers
  const openEdit = (speaker: Speaker) => {
    setEditSpeaker(speaker);
    setEditForm({
      name: speaker.name,
      specialty: speaker.specialty || speaker.role,
      city: speaker.city,
      base_fee: speaker.base_fee,
      fee_details: (speaker as any).fee_details,
      biography: speaker.biography,
      image_url: speaker.image_url,
      video_url: speaker.video_url,
      themes: speaker.themes,
      languages: speaker.languages,
      featured: speaker.featured,
      featured_order: (speaker as any).featured_order,
      display_order: (speaker as any).display_order,
      gender: speaker.gender,
      why_expertise: speaker.why_expertise,
      why_impact: speaker.why_impact,
      phone: speaker.phone,
      email: speaker.email,
    } as any);
  };

  const handleSave = async () => {
    if (!editSpeaker) return;
    setSaving(true);
    const { error } = await supabase
      .from("speakers")
      .update({
        name: editForm.name,
        role: editForm.specialty || null,
        specialty: editForm.specialty || null,
        city: editForm.city || null,
        base_fee: editForm.base_fee || null,
        fee_details: (editForm as any).fee_details || null,
        biography: editForm.biography || null,
        image_url: editForm.image_url || null,
        video_url: editForm.video_url || null,
        themes: editForm.themes || [],
        languages: editForm.languages || [],
        featured: editForm.featured ?? false,
        featured_order: (editForm as any).featured_order || null,
        display_order: (editForm as any).display_order ?? 999,
        gender: editForm.gender || 'male',
        why_expertise: editForm.why_expertise || null,
        why_impact: editForm.why_impact || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
      } as any)
      .eq("id", editSpeaker.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
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
    await supabase.from("speaker_conferences").delete().eq("speaker_id", speaker.id);
    await supabase.from("reviews").delete().eq("speaker_id", speaker.id);
    const { error } = await supabase.from("speakers").delete().eq("id", speaker.id);
    if (error) { toast.error("Erreur de suppression"); return; }
    toast.success("Fiche supprimée définitivement");
    setEditSpeaker(null);
    fetchSpeakers();
  };

  // Manual speaker creation
  const handleManualCreate = async () => {
    if (!manualForm.name.trim()) { toast.error("Le nom est requis"); return; }
    setCreatingManual(true);
    const slug = manualForm.name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    const { data: inserted, error } = await supabase.from("speakers").insert({
      name: manualForm.name.trim(),
      slug,
      role: manualForm.specialty || null,
      specialty: manualForm.specialty || null,
      city: manualForm.city || null,
      base_fee: manualForm.base_fee ? Number(manualForm.base_fee) : null,
      fee_details: manualForm.fee_details || null,
      phone: manualForm.phone || null,
      email: manualForm.email || null,
      gender: manualForm.gender,
      themes: manualForm.themes ? manualForm.themes.split(",").map(t => t.trim()).filter(Boolean) : [],
      languages: manualForm.languages ? manualForm.languages.split(",").map(l => l.trim()).filter(Boolean) : [],
      biography: manualForm.biography || null,
      archived: manualForm.archived,
    } as any).select().single();
    setCreatingManual(false);
    if (error) { toast.error(`Erreur : ${error.message}`); return; }
    toast.success(`${manualForm.name} créé avec succès ! Ouvrez la fiche pour compléter les détails.`);
    setShowManualCreate(false);
    setManualForm({ name: "", specialty: "", city: "", base_fee: "", fee_details: "", phone: "", email: "", gender: "male", themes: "", languages: "Français", biography: "", archived: false });
    await fetchSpeakers();
    // Auto-open edit dialog for the newly created speaker
    if (inserted) {
      openEdit(inserted as Speaker);
    }
  };

  // AI Regeneration
  const handleRegenerate = async (field: "biography" | "why_expertise" | "why_impact") => {
    if (!editSpeaker) return;
    setRegenerating(field);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-speaker-content`;
      const session = await supabase.auth.getSession();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ speaker_id: editSpeaker.id, field }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setEditForm(prev => ({ ...prev, [field]: data.content }));
      toast.success("Contenu régénéré par l'IA !");
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    }
    setRegenerating(null);
  };

  // Import handler
  const handleImportSearch = async () => {
    if (!importName.trim() || importName.trim().length < 2) {
      toast.error("Entrez un nom valide (min 2 caractères)");
      return;
    }
    setImportSearching(true);
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
        body: JSON.stringify({ name: importName.trim() }),
      });
      const data = await resp.json();
      if (!data.success) { toast.error(data.error || "Conférencier non trouvé"); return; }

      // If profile is flagged as offline (fallback sources), set archived=true
      const isOffline = data.profile.offline === true;

      // Publish directly via publish-speaker
      const pubResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-speaker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          profile: {
            name: data.profile.name,
            slug: data.profile.slug,
            role: data.profile.role || data.profile.specialty,
            specialty: data.profile.role || data.profile.specialty,
            biography: data.profile.biography,
            themes: data.profile.themes,
            languages: data.profile.languages,
            gender: data.profile.gender,
            key_points: data.profile.key_points,
            why_expertise: data.profile.why_expertise,
            why_impact: data.profile.why_impact,
            photo_url: data.profile.photo_url,
            video_url: data.profile.video_url,
            city: data.profile.city,
            archived: isOffline,
          },
          conferences: data.profile.conferences,
        }),
      });
      const pubData = await pubResp.json();
      if (!pubData.success) throw new Error(pubData.error);

      toast.success(isOffline 
        ? `${data.profile.name} créé HORS LIGNE (sources : Wikipedia/Evene/Gala). Enrichissez la fiche manuellement.`
        : `${data.profile.name} importé avec succès !`);
      setImportName("");
      setShowImport(false);
      fetchSpeakers();
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    }
    setImportSearching(false);
  };

  // Reviews
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

  // Conference CRUD handlers
  const handleAddConference = async () => {
    if (!editSpeaker || !newConference.title.trim()) return;
    const maxOrder = conferences.reduce((max, c) => Math.max(max, c.display_order || 0), 0);
    const { error } = await supabase.from("speaker_conferences").insert({
      speaker_id: editSpeaker.id,
      title: newConference.title.trim(),
      description: newConference.description.trim() || null,
      display_order: maxOrder + 1,
    } as any);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Conférence ajoutée");
    setNewConference({ title: "", description: "" });
    setShowAddConference(false);
    fetchConferences(editSpeaker.id);
  };

  const handleDeleteConference = async (confId: string) => {
    const { error } = await supabase.from("speaker_conferences").delete().eq("id", confId);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Conférence supprimée");
    if (editSpeaker) fetchConferences(editSpeaker.id);
  };

  const handleSaveConference = async (confId: string) => {
    const { error } = await supabase.from("speaker_conferences").update({
      title: editConfForm.title,
      description: editConfForm.description || null,
    } as any).eq("id", confId);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Conférence mise à jour");
    setEditingConfId(null);
    if (editSpeaker) fetchConferences(editSpeaker.id);
  };

  const handleReformulateConference = async (confId: string) => {
    const conf = conferences.find(c => c.id === confId);
    if (!conf || !editSpeaker) return;
    setRegeneratingConf(confId);
    try {
      const { data, error } = await supabase.functions.invoke("format-conference-descriptions", {
        body: {
          speaker_id: editSpeaker.id,
          conference_id: confId,
          title: conf.title,
          description: conf.description || "",
          speaker_name: editSpeaker.name,
          speaker_role: editSpeaker.specialty || editSpeaker.role || "",
        },
      });
      if (error) throw error;
      if (data?.description) {
        await supabase.from("speaker_conferences").update({ description: data.description } as any).eq("id", confId);
        toast.success("Description reformulée par l'IA !");
        fetchConferences(editSpeaker.id);
      }
    } catch (err: any) {
      toast.error(`Erreur IA : ${err.message}`);
    }
    setRegeneratingConf(null);
  };

  // AI: Generate a new conference from speaker profile
  const handleAiGenerateConference = async () => {
    if (!editSpeaker) return;
    setGeneratingAiConf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-conferences", {
        body: { speaker_ids: [editSpeaker.id], mode: "generate_single" },
      });
      if (error) throw error;
      if (data?.results?.[0]?.error) throw new Error(data.results[0].error);
      toast.success("Conférence générée par l'IA !");
      fetchConferences(editSpeaker.id);
    } catch (err: any) {
      toast.error(`Erreur IA : ${err.message}`);
    }
    setGeneratingAiConf(false);
  };

  // AI: Regenerate conference title based on its content
  const handleRegenerateConfTitle = async (confId: string) => {
    const conf = conferences.find(c => c.id === confId);
    if (!conf || !editSpeaker) return;
    setRegeneratingConfTitle(confId);
    try {
      const { data, error } = await supabase.functions.invoke("format-conference-descriptions", {
        body: {
          speaker_id: editSpeaker.id,
          conference_id: confId,
          title: conf.title,
          description: conf.description || "",
          speaker_name: editSpeaker.name,
          speaker_role: editSpeaker.specialty || editSpeaker.role || "",
          mode: "title_only",
        },
      });
      if (error) throw error;
      if (data?.title) {
        await supabase.from("speaker_conferences").update({ title: data.title } as any).eq("id", confId);
        toast.success("Titre régénéré par l'IA !");
        fetchConferences(editSpeaker.id);
      }
    } catch (err: any) {
      toast.error(`Erreur IA : ${err.message}`);
    }
    setRegeneratingConfTitle(null);
  };

  // Enrichment handler
  const handleEnrichAll = async () => {
    if (enriching) return;
    setEnriching(true);
    setShowEnrichLog(true);
    setEnrichLog([]);
    setEnrichProgress({ processed: 0, total: 0, current: "Démarrage..." });

    const session = await supabase.auth.getSession();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.data.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-speakers`;

    let offset = 0;
    let done = false;
    const batchSize = 3;

    while (!done) {
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ offset, batch_size: batchSize, mode: "all" }),
        });
        const data = await resp.json();
        if (!data.success) { setEnrichLog(prev => [...prev, `❌ Erreur: ${data.error}`]); break; }

        done = data.done;
        offset = data.next_offset;
        setEnrichProgress({ processed: offset, total: data.total, current: "" });

        for (const r of data.results || []) {
          const updates = r.updates?.length ? r.updates.join(", ") : "rien";
          const log = r.error
            ? `❌ ${r.name}: ${r.error}`
            : r.updates?.length
              ? `✅ ${r.name}: ${updates}${r.bio_source ? ` (bio: ${r.bio_source})` : ""}`
              : `⏭ ${r.name}: rien à mettre à jour`;
          setEnrichLog(prev => [...prev, log]);
        }
      } catch (err: any) {
        setEnrichLog(prev => [...prev, `❌ Erreur réseau: ${err.message}`]);
        break;
      }
    }

    setEnriching(false);
    setEnrichProgress(prev => ({ ...prev, current: "Terminé !" }));
    toast.success("Enrichissement terminé !");
    fetchSpeakers();
  };
  const handleRegenerateWhyAll = async () => {
    if (enriching) return;
    setEnriching(true);
    setShowEnrichLog(true);
    setEnrichLog([]);
    setEnrichProgress({ processed: 0, total: 0, current: "Régénération expertise/impact..." });

    try {
      const session = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-why-blocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await resp.json();
      if (data.success) {
        setEnrichLog([`✅ ${data.updated} speakers mis à jour, ${data.failed} erreurs (sur ${data.total} à traiter)`]);
        toast.success(`Expertise/Impact régénérés pour ${data.updated} speakers`);
      } else {
        setEnrichLog([`❌ Erreur: ${data.error}`]);
        toast.error("Erreur lors de la régénération");
      }
    } catch (err: any) {
      setEnrichLog([`❌ Erreur réseau: ${err.message}`]);
      toast.error("Erreur réseau");
    }

    setEnriching(false);
    setEnrichProgress(prev => ({ ...prev, current: "Terminé !" }));
    fetchSpeakers();
  };

  // WeChamp conference enrichment
  const handleEnrichConferences = async () => {
    if (enriching) return;
    setEnriching(true);
    setShowEnrichLog(true);
    setEnrichLog([]);
    setEnrichProgress({ processed: 0, total: 0, current: "Scraping WeChamp + IA..." });

    const session = await supabase.auth.getSession();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.data.session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-wechamp-conferences`;

    let offset = 0;
    let done = false;

    while (!done) {
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ offset, batchSize: 3 }),
        });
        const data = await resp.json();
        if (!data.success) { setEnrichLog(prev => [...prev, `❌ Erreur: ${data.error}`]); break; }

        done = data.done;
        offset = data.next_offset;
        setEnrichProgress({ processed: offset, total: data.totalMissing, current: "" });

        for (const r of data.results || []) {
          const log = r.status === 'ok'
            ? `✅ ${r.name}: ${r.count} conférence(s) → ${r.titles?.join(', ')}`
            : r.status === 'not_found_on_wechamp'
              ? `⏭ ${r.name}: pas trouvé sur WeChamp`
              : r.status === 'no_conferences_found'
                ? `⏭ ${r.name}: pas de conférences trouvées`
                : `❌ ${r.name}: ${r.error || r.status}`;
          setEnrichLog(prev => [...prev, log]);
        }
      } catch (err: any) {
        setEnrichLog(prev => [...prev, `❌ Erreur réseau: ${err.message}`]);
        break;
      }
    }

    setEnriching(false);
    setEnrichProgress(prev => ({ ...prev, current: "Terminé !" }));
    toast.success("Enrichissement conférences terminé !");
    fetchSpeakers();
  };

  // Single speaker enrichment from URL
  const handleEnrichSingle = async () => {
    if (!editSpeaker || !enrichUrl.trim()) return;
    setEnrichingSingle(true);
    try {
      const session = await supabase.auth.getSession();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.data.session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      
      // Use the import search flow with the speaker's name
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-competitor-speakers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: editSpeaker.name, enrich: true }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Conférencier non trouvé sur ce site");
      
      const profile = data.profile;
      const updateData: any = {};
      if (profile.biography) updateData.biography = profile.biography;
      if (profile.photo_url && (!editSpeaker.image_url || editSpeaker.image_url === "/placeholder.svg")) updateData.image_url = profile.photo_url;
      if (profile.role && !editSpeaker.role) { updateData.role = profile.role; updateData.specialty = profile.role; }
      if (profile.themes?.length && (!editSpeaker.themes || editSpeaker.themes.length === 0)) updateData.themes = profile.themes;
      if (profile.languages?.length && (!editSpeaker.languages || editSpeaker.languages.length === 0)) updateData.languages = profile.languages;
      if (profile.video_url && !editSpeaker.video_url) updateData.video_url = profile.video_url;
      if (profile.city && !editSpeaker.city) updateData.city = profile.city;
      if (profile.why_expertise && !editSpeaker.why_expertise) updateData.why_expertise = profile.why_expertise;
      if (profile.why_impact && !editSpeaker.why_impact) updateData.why_impact = profile.why_impact;
      if (profile.key_points?.length) updateData.key_points = profile.key_points;

      if (Object.keys(updateData).length > 0) {
        await supabase.from("speakers").update(updateData).eq("id", editSpeaker.id);
      }

      // Import conferences if none exist yet
      if (profile.conferences?.length) {
        const existingConfs = await supabase.from("speaker_conferences").select("id").eq("speaker_id", editSpeaker.id);
        if (!existingConfs.data?.length) {
          for (let i = 0; i < profile.conferences.length; i++) {
            const conf = profile.conferences[i];
            await supabase.from("speaker_conferences").insert({
              speaker_id: editSpeaker.id,
              title: conf.title,
              description: conf.description || null,
              display_order: i,
            } as any);
          }
        }
      }
      
      const updatedFields = Object.keys(updateData);
      toast.success(`Fiche enrichie ! ${updatedFields.length > 0 ? "Champs : " + updatedFields.join(", ") : "Aucun nouveau champ"}`);
      setShowEnrichSingle(false);
      setEnrichUrl("");
      await fetchSpeakers();
      const { data: refreshed } = await supabase.from("speakers")
        .select("id, name, slug, role, themes, image_url, biography, specialty, base_fee, fee_details, city, languages, video_url, featured, gender, archived, created_at, why_expertise, why_impact, phone, email")
        .eq("id", editSpeaker.id).single();
      if (refreshed) openEdit(refreshed as Speaker);
      fetchConferences(editSpeaker.id);
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    }
    setEnrichingSingle(false);
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
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowImport(!showImport)}
          >
            <UserPlus className="h-4 w-4" /> Importer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowManualCreate(!showManualCreate)}
          >
            <Plus className="h-4 w-4" /> Créer manuellement
          </Button>
        </div>

        {/* Import inline */}
        {showImport && (
          <div className="border border-border rounded-lg p-4 bg-card space-y-2">
            <p className="text-xs text-muted-foreground">
              Recherchez un conférencier sur les sites concurrents et importez sa fiche automatiquement.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du conférencier (ex: Bertrand Piccard)"
                value={importName}
                onChange={e => setImportName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleImportSearch()}
                className="flex-grow"
              />
              <Button onClick={handleImportSearch} disabled={importSearching} size="sm" className="gap-1.5 min-w-[120px]">
                {importSearching ? <><Loader2 className="h-4 w-4 animate-spin" /> Recherche…</> : <><Search className="h-4 w-4" /> Importer</>}
              </Button>
            </div>
          </div>
        )}

        {/* Manual creation inline */}
        {showManualCreate && (
          <div className="border border-border rounded-lg p-4 bg-card space-y-3">
            <p className="text-xs text-muted-foreground">
              Créez une fiche conférencier manuellement. Vous pouvez choisir de l'afficher ou non sur le site.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nom *</Label>
                <Input value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Titre / Rôle</Label>
                <Input value={manualForm.specialty} onChange={e => setManualForm(p => ({ ...p, specialty: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Ville</Label>
                <Input value={manualForm.city} onChange={e => setManualForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cachet de base (€)</Label>
                <Input type="number" value={manualForm.base_fee} onChange={e => setManualForm(p => ({ ...p, base_fee: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Genre</Label>
                <select className="w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={manualForm.gender} onChange={e => setManualForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="male">Masculin</option>
                  <option value="female">Féminin</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Détails tarifs</Label>
              <Input value={manualForm.fee_details} onChange={e => setManualForm(p => ({ ...p, fee_details: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">📱 Téléphone</Label>
                <Input value={manualForm.phone} onChange={e => setManualForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">📧 Email</Label>
                <Input type="email" value={manualForm.email} onChange={e => setManualForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Thématiques (séparées par virgules)</Label>
              <Input value={manualForm.themes} onChange={e => setManualForm(p => ({ ...p, themes: e.target.value }))} placeholder="Leadership, Communication Non Violente" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Langues</Label>
              <Input value={manualForm.languages} onChange={e => setManualForm(p => ({ ...p, languages: e.target.value }))} placeholder="Français, Anglais" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={manualForm.archived} onChange={e => setManualForm(p => ({ ...p, archived: e.target.checked }))} className="rounded border-input" />
              <span className="text-sm flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5" /> Ne pas afficher sur le site (base interne uniquement)
              </span>
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleManualCreate} disabled={creatingManual || !manualForm.name.trim()} className="gap-1.5">
                {creatingManual ? <><Loader2 className="h-4 w-4 animate-spin" /> Création…</> : <><Plus className="h-4 w-4" /> Créer la fiche</>}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowManualCreate(false)}>Annuler</Button>
            </div>
          </div>
        )}

        {/* Enrichment log */}
        {showEnrichLog && enrichLog.length > 0 && (
          <div className="border border-border rounded-lg p-4 bg-card space-y-2 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                Journal d'enrichissement {enrichProgress.processed}/{enrichProgress.total}
              </p>
              {!enriching && (
                <Button variant="ghost" size="sm" onClick={() => setShowEnrichLog(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {enrichLog.map((log, i) => (
              <p key={i} className="text-xs text-muted-foreground font-mono">{log}</p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <select className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value as any)}>
            <option value="all">Visibilité : tous</option>
            <option value="online">🟢 En ligne</option>
            <option value="offline">🔴 Hors ligne (CRM uniquement)</option>
          </select>
          <select className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={themeFilter} onChange={e => setThemeFilter(e.target.value)}>
            <option value="">Toutes les thématiques</option>
            {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">Toutes les villes</option>
            {allCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={feeFilter} onChange={e => setFeeFilter(e.target.value as any)}>
            <option value="all">Tarif : tous</option>
            <option value="set">Tarif renseigné</option>
            <option value="unset">Tarif non renseigné</option>
          </select>
          {/* Fee range filter */}
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="Min €"
              value={feeMinFilter}
              onChange={e => setFeeMinFilter(e.target.value)}
              className="w-20 h-9 text-sm"
            />
            <span className="text-xs text-muted-foreground">à</span>
            <Input
              type="number"
              placeholder="Max €"
              value={feeMaxFilter}
              onChange={e => setFeeMaxFilter(e.target.value)}
              className="w-20 h-9 text-sm"
            />
          </div>
          <select className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={genderFilter} onChange={e => setGenderFilter(e.target.value as any)}>
            <option value="all">Sexe : tous</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
          </select>
          <select className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm" value={profileFilter} onChange={e => setProfileFilter(e.target.value)}>
            <option value="">Profil : tous</option>
            {PROFILE_TYPES.map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}
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

      {/* Speaker table */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:flex items-center gap-4 px-3 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="w-10 flex-shrink-0"></span>
          <button onClick={() => { setSortBy("name"); setSortDir(d => sortBy === "name" ? (d === "asc" ? "desc" : "asc") : "asc"); }} className="flex-grow min-w-0 flex items-center gap-1 hover:text-foreground transition-colors text-left">
            Nom {sortBy === "name" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
          </button>
          <button onClick={() => { setSortBy("created_at"); setSortDir(d => sortBy === "created_at" ? (d === "asc" ? "desc" : "asc") : "desc"); }} className="w-[100px] flex-shrink-0 flex items-center gap-1 justify-end hover:text-foreground transition-colors">
            Ajouté le {sortBy === "created_at" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
          </button>
          <span className="w-[180px] flex-shrink-0">Thèmes</span>
          <span className="w-[90px] flex-shrink-0">Ville</span>
          <button onClick={() => { setSortBy("base_fee"); setSortDir(d => sortBy === "base_fee" ? (d === "asc" ? "desc" : "asc") : "desc"); }} className="w-[70px] flex-shrink-0 flex items-center gap-1 justify-end hover:text-foreground transition-colors">
            Tarif {sortBy === "base_fee" ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
          </button>
          <span className="w-[100px] flex-shrink-0"></span>
        </div>
        <div className="divide-y divide-border">
        {filteredSpeakers.map(speaker => {
          const themes = parseThemes(speaker.themes);
          const imageUrl = speaker.image_url && speaker.image_url !== "/placeholder.svg" ? speaker.image_url : null;
          return (
            <div
              key={speaker.id}
              className={`flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors cursor-pointer group ${speaker.archived ? "opacity-60" : ""}`}
              onClick={() => openEdit(speaker)}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={speaker.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{speaker.name}</span>
                  {speaker.featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground font-medium">★</span>}
                  {speaker.archived
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Hors ligne</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">En ligne</span>
                  }
                </div>
                {(speaker.specialty || speaker.role) && <p className="text-xs text-muted-foreground truncate">{speaker.specialty || speaker.role}</p>}
              </div>
              <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-xs text-muted-foreground">
                <span className="w-[100px] text-right whitespace-nowrap">{new Date(speaker.created_at).toLocaleDateString("fr-FR")}</span>
                <span className="w-[180px] truncate">{themes.length > 0 ? themes.slice(0, 2).join(", ") + (themes.length > 2 ? ` +${themes.length - 2}` : "") : "—"}</span>
                <span className="w-[90px] truncate">{speaker.city ? <><MapPin className="h-3 w-3 inline mr-1" />{speaker.city}</> : "—"}</span>
                <span className={`w-[70px] text-right whitespace-nowrap ${speaker.base_fee ? "font-semibold text-foreground" : "italic text-muted-foreground/50"}`}>
                  {speaker.base_fee ? `${speaker.base_fee.toLocaleString("fr-FR")} €` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 w-[100px] justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); handleArchive(speaker); }} title={speaker.archived ? "Restaurer" : "Archiver"}>
                  {speaker.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); openEdit(speaker); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <a href={`/conferencier/${speaker.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="h-8 w-8 flex items-center justify-center">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-accent transition-colors" />
                </a>
              </div>
            </div>
          );
        })}
        </div>
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
              {/* Visibility badge + Enrich button */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded font-medium ${editSpeaker.archived ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700"}`}>
                  {editSpeaker.archived ? "🔴 Hors ligne (CRM uniquement)" : "🟢 En ligne"}
                </span>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEnrichSingle(!showEnrichSingle)}>
                  <Sparkles className="h-3.5 w-3.5" /> Enrichir la fiche
                </Button>
              </div>

              {/* Enrich from URL */}
              {showEnrichSingle && (
                <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Renseignez l'URL d'un site concurrent pour enrichir automatiquement cette fiche (biographie, conférences, photo…).
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://www.simoneetnelson.com/conferencier/..."
                      value={enrichUrl}
                      onChange={e => setEnrichUrl(e.target.value)}
                      className="flex-grow"
                    />
                    <Button size="sm" disabled={enrichingSingle || !enrichUrl.trim()} onClick={handleEnrichSingle} className="gap-1.5 min-w-[120px]">
                      {enrichingSingle ? <><Loader2 className="h-4 w-4 animate-spin" /> Enrichissement…</> : <><Search className="h-4 w-4" /> Enrichir</>}
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                {editForm.image_url ? (
                  <img src={editForm.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-grow space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">URL de la photo</Label>
                    <Input value={editForm.image_url || ""} onChange={e => setEditForm(p => ({ ...p, image_url: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ou importer une photo (JPG, PNG)</Label>
                    <Input 
                      type="file" 
                      accept="image/jpeg,image/png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editSpeaker) return;
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                        const filePath = `${editSpeaker.slug}.${ext}`;
                        toast.info("Upload en cours…");
                        const { error: upErr } = await supabase.storage.from('speaker-photos').upload(filePath, file, { upsert: true });
                        if (upErr) { toast.error(`Erreur upload : ${upErr.message}`); return; }
                        const { data: urlData } = supabase.storage.from('speaker-photos').getPublicUrl(filePath);
                        setEditForm(p => ({ ...p, image_url: urlData.publicUrl }));
                        toast.success("Photo importée !");
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <Input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Titre / Rôle (affiché sur la carte et le profil)</Label>
                  <Input value={editForm.specialty || ""} onChange={e => setEditForm(p => ({ ...p, specialty: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ville</Label>
                  <Input value={editForm.city || ""} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cachet de base (€)</Label>
                  <Input type="number" value={editForm.base_fee ?? ""} onChange={e => setEditForm(p => ({ ...p, base_fee: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>

              {/* Fee details */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">📋 Détails des tarifs (tous les tarifs : physique, distanciel, province…)</Label>
                <Input value={(editForm as any).fee_details || ""} onChange={e => setEditForm(p => ({ ...p, fee_details: e.target.value }))} />
              </div>

              {/* Phone & Email (internal only) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">📱 Téléphone (interne)</Label>
                  <Input value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">📧 Email (interne)</Label>
                  <Input type="email" value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Langues d'intervention</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(editForm.languages || []).map((lang, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-accent/10 text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-accent/20">
                        {lang}
                        <button type="button" onClick={() => {
                          const newLangs = [...(editForm.languages || [])];
                          newLangs.splice(idx, 1);
                          setEditForm(p => ({ ...p, languages: newLangs }));
                        }} className="hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                        {idx > 0 && (
                          <button type="button" onClick={() => {
                            const newLangs = [...(editForm.languages || [])];
                            [newLangs[idx - 1], newLangs[idx]] = [newLangs[idx], newLangs[idx - 1]];
                            setEditForm(p => ({ ...p, languages: newLangs }));
                          }} className="hover:text-accent transition-colors" title="Monter">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="rounded-lg border border-input bg-background text-foreground px-3 py-1.5 text-sm flex-grow"
                      value=""
                      onChange={e => {
                        if (e.target.value && !(editForm.languages || []).includes(e.target.value)) {
                          setEditForm(p => ({ ...p, languages: [...(p.languages || []), e.target.value] }));
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="">Ajouter une langue…</option>
                      {["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais", "Néerlandais", "Arabe", "Chinois", "Japonais", "Russe", "Coréen", "Hindi"].filter(l => !(editForm.languages || []).includes(l)).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3" /> URL vidéo (YouTube)</Label>
                    <Input value={editForm.video_url || ""} onChange={e => setEditForm(p => ({ ...p, video_url: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ou importer une vidéo (MP4)</Label>
                    <Input 
                      type="file" 
                      accept="video/mp4"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editSpeaker) return;
                        const filePath = `${editSpeaker.slug}.mp4`;
                        toast.info("Upload vidéo en cours…");
                        const { error: upErr } = await supabase.storage.from('speaker-videos').upload(filePath, file, { upsert: true });
                        if (upErr) { toast.error(`Erreur upload : ${upErr.message}`); return; }
                        const { data: urlData } = supabase.storage.from('speaker-videos').getPublicUrl(filePath);
                        setEditForm(p => ({ ...p, video_url: urlData.publicUrl }));
                        toast.success("Vidéo importée !");
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Thématiques (séparées par des virgules)</Label>
                <Input value={(editForm.themes || []).join(", ")} onChange={e => setEditForm(p => ({ ...p, themes: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} />
              </div>

              {/* Biography with AI regeneration */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Biographie</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => handleRegenerate("biography")}
                    disabled={regenerating === "biography"}
                  >
                    {regenerating === "biography" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Régénérer avec l'IA
                  </Button>
                </div>
                <RichTextEditor
                  value={editForm.biography || ""}
                  onChange={(val) => setEditForm(p => ({ ...p, biography: val }))}
                  placeholder="Biographie du conférencier…"
                  minHeight="200px"
                />
              </div>

              {/* Why Expertise with AI regeneration */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Expertise reconnue</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => handleRegenerate("why_expertise")}
                    disabled={regenerating === "why_expertise"}
                  >
                    {regenerating === "why_expertise" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Régénérer avec l'IA
                  </Button>
                </div>
                <Textarea
                  value={editForm.why_expertise || ""}
                  onChange={e => setEditForm(p => ({ ...p, why_expertise: e.target.value }))}
                  placeholder="Expertise reconnue du conférencier…"
                  rows={3}
                />
              </div>

              {/* Why Impact with AI regeneration */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Impact mesurable</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => handleRegenerate("why_impact")}
                    disabled={regenerating === "why_impact"}
                  >
                    {regenerating === "why_impact" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Régénérer avec l'IA
                  </Button>
                </div>
                <Textarea
                  value={editForm.why_impact || ""}
                  onChange={e => setEditForm(p => ({ ...p, why_impact: e.target.value }))}
                  placeholder="Impact mesurable des interventions…"
                  rows={3}
                />
              </div>

              {/* Conferences section */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Conférences ({conferences.length})
                  </Label>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAiGenerateConference} disabled={generatingAiConf}>
                      {generatingAiConf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Générer via IA
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAddConference(!showAddConference)}>
                      <Plus className="h-3.5 w-3.5" /> Ajouter
                    </Button>
                  </div>
                </div>

                {showAddConference && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Titre</Label>
                      <Input value={newConference.title} onChange={e => setNewConference(p => ({ ...p, title: e.target.value }))} placeholder="Titre de la conférence" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Description (HTML)</Label>
                      <RichTextEditor
                        value={newConference.description}
                        onChange={(val) => setNewConference(p => ({ ...p, description: val }))}
                        placeholder="Description de la conférence…"
                        minHeight="120px"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddConference} disabled={!newConference.title.trim()}>Ajouter</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddConference(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                {loadingConferences ? (
                  <p className="text-xs text-muted-foreground">Chargement…</p>
                ) : conferences.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Aucune conférence pour ce conférencier.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {conferences.map(conf => (
                      <div key={conf.id} className="p-3 bg-muted/20 rounded-lg text-sm space-y-2">
                        {editingConfId === conf.id ? (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Titre</Label>
                              <Input value={editConfForm.title} onChange={e => setEditConfForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Description</Label>
                              <RichTextEditor
                                value={editConfForm.description}
                                onChange={(val) => setEditConfForm(p => ({ ...p, description: val }))}
                                placeholder="Description…"
                                minHeight="120px"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="gap-1" onClick={() => handleSaveConference(conf.id)}>
                                <Save className="h-3.5 w-3.5" /> Enregistrer
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingConfId(null)}>Annuler</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-foreground">{conf.title}</h4>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                  setEditingConfId(conf.id);
                                  setEditConfForm({ title: conf.title, description: conf.description || "" });
                                }} title="Modifier">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRegenerateConfTitle(conf.id)} disabled={regeneratingConfTitle === conf.id} title="Régénérer le titre via IA">
                                  {regeneratingConfTitle === conf.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReformulateConference(conf.id)} disabled={regeneratingConf === conf.id} title="Reformuler la description via IA">
                                  {regeneratingConf === conf.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteConference(conf.id)} title="Supprimer">
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            {conf.description && (
                              <div className="text-xs text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: conf.description }} />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.featured ?? false} onChange={e => setEditForm(p => ({ ...p, featured: e.target.checked }))} className="rounded border-input" />
                    <span className="text-sm">Mis en avant (featured)</span>
                  </label>
                  {editForm.featured && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Position carrousel (1-5)</Label>
                      <Input type="number" min={1} max={5} value={(editForm as any).featured_order ?? ""} onChange={e => setEditForm(p => ({ ...p, featured_order: e.target.value ? Number(e.target.value) : null }))} className="w-20 h-8 text-sm" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Genre</Label>
                    <select className="rounded-lg border border-input bg-background text-foreground px-3 py-1.5 text-sm" value={editForm.gender || "male"} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="male">Masculin</option>
                      <option value="female">Féminin</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Position sur /conferenciers</Label>
                  <Input type="number" min={1} value={(editForm as any).display_order ?? ""} onChange={e => setEditForm(p => ({ ...p, display_order: e.target.value ? Number(e.target.value) : 999 }))} className="w-24 h-8 text-sm" />
                  <span className="text-xs text-muted-foreground">(plus petit = plus haut)</span>
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
                        <Input value={newReview.author_title} onChange={e => setNewReview(p => ({ ...p, author_title: e.target.value }))} placeholder="Directeur Délégué" />
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
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleArchive(editSpeaker)}>
                    {editSpeaker.archived ? <><Eye className="h-3.5 w-3.5" /> Mettre en ligne</> : <><EyeOff className="h-3.5 w-3.5" /> Mettre hors ligne</>}
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
