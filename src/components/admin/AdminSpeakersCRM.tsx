import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, MapPin, Euro, RefreshCw, ExternalLink, Upload } from "lucide-react";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";
import { toast } from "sonner";

type Speaker = {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  themes: string[] | null;
  image_url: string | null;
  biography: string | null;
  base_fee: number | null;
  city: string | null;
  languages: string[] | null;
};

const DEFAULT_IMAGE = "https://www.lesconferenciers.com/wp-content/uploads/2022/05/thierry-marx-portrait.png";

const AdminSpeakersCRM = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [feeFilter, setFeeFilter] = useState<"all" | "set" | "unset">("all");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      // Call edge function with raw CSV text via fetch
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
      toast.success(`Import terminé : ${data.updated} mis à jour, ${data.conferencesInserted} conférences ajoutées`);
      if (data.notFound?.length > 0) {
        toast.info(`${data.notFound.length} non trouvés : ${data.notFound.slice(0, 5).join(", ")}${data.notFound.length > 5 ? "…" : ""}`);
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
      .select("id, name, slug, role, themes, image_url, biography, base_fee, city, languages")
      .order("name");
    setSpeakers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSpeakers(); }, []);

  // Extract all unique themes across speakers
  const allThemes = useMemo(() => {
    const themeSet = new Set<string>();
    speakers.forEach(s => {
      parseThemes(s.themes).forEach(t => themeSet.add(t));
    });
    return Array.from(themeSet).sort();
  }, [speakers]);

  // Extract all unique cities
  const allCities = useMemo(() => {
    const citySet = new Set<string>();
    speakers.forEach(s => {
      if (s.city) citySet.add(s.city);
    });
    return Array.from(citySet).sort();
  }, [speakers]);

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  const filteredSpeakers = useMemo(() => {
    return speakers.filter(s => {
      // Search by name
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;

      // Filter by themes
      if (selectedThemes.length > 0) {
        const speakerThemes = parseThemes(s.themes);
        if (!selectedThemes.some(t => speakerThemes.includes(t))) return false;
      }

      // Filter by city
      if (cityFilter && s.city !== cityFilter) return false;

      // Filter by fee
      if (feeFilter === "set" && !s.base_fee) return false;
      if (feeFilter === "unset" && s.base_fee) return false;

      return true;
    });
  }, [speakers, search, selectedThemes, cityFilter, feeFilter]);

  const clearFilters = () => {
    setSearch("");
    setSelectedThemes([]);
    setCityFilter("");
    setFeeFilter("all");
  };

  const hasFilters = search || selectedThemes.length > 0 || cityFilter || feeFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={fetchSpeakers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCSV}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> {importing ? "Import…" : "Importer CSV"}
          </Button>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          {/* City filter */}
          <select
            className="rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
          >
            <option value="">Toutes les villes</option>
            {allCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
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
        </div>

        {/* Theme filter pills */}
        {allThemes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allThemes.map(theme => (
              <button
                key={theme}
                onClick={() => toggleTheme(theme)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  selectedThemes.includes(theme)
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-accent/50"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredSpeakers.length} conférencier{filteredSpeakers.length !== 1 ? "s" : ""}
        {hasFilters ? " (filtré)" : ""}
      </p>

      {/* Speaker grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSpeakers.map(speaker => {
          const themes = parseThemes(speaker.themes);
          const imageUrl = speaker.image_url && speaker.image_url !== "/placeholder.svg"
            ? speaker.image_url
            : DEFAULT_IMAGE;

          return (
            <div
              key={speaker.id}
              className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4 p-4">
                {/* Avatar */}
                <img
                  src={imageUrl}
                  alt={speaker.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{speaker.name}</h3>
                  {speaker.role && (
                    <p className="text-xs text-muted-foreground truncate">{speaker.role}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {speaker.city && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {speaker.city}
                      </span>
                    )}
                    {speaker.base_fee ? (
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Euro className="h-3 w-3" /> {speaker.base_fee.toLocaleString("fr-FR")} €
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">Tarif non renseigné</span>
                    )}
                  </div>
                </div>
                <a
                  href={`/speaker/${speaker.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-accent transition-colors" />
                </a>
              </div>

              {/* Themes */}
              {themes.length > 0 && (
                <div className="px-4 pb-4 flex flex-wrap gap-1">
                  {themes.slice(0, 4).map(theme => (
                    <span
                      key={theme}
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getThemeColor(theme)}`}
                    >
                      {theme}
                    </span>
                  ))}
                  {themes.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{themes.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredSpeakers.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-12">
          Aucun conférencier ne correspond à vos critères.
        </div>
      )}
    </div>
  );
};

export default AdminSpeakersCRM;
