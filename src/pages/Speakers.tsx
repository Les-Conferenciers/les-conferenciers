
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";

const PAGE_SIZE = 20;

const Speakers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialTheme = searchParams.get("theme") || null;
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(initialTheme);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedTheme) params.set("theme", selectedTheme);
    setSearchParams(params);
  }, [searchQuery, selectedTheme, setSearchParams]);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery, selectedTheme]);

  const { data: allSpeakers, isLoading } = useQuery({
    queryKey: ["speakers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("speakers").select("*").limit(500);
      if (error) throw error;
      return data as Speaker[];
    },
  });

  // Extract all unique themes from all speakers
  const allThemes = (() => {
    if (!allSpeakers) return [];
    const themes = new Set<string>();
    allSpeakers.forEach((s) => {
      parseThemes(s.themes).forEach((t) => themes.add(t));
    });
    return Array.from(themes).sort();
  })();

  // Filter speakers
  const speakers = allSpeakers?.filter((s) => {
    const matchesSearch = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.biography?.toLowerCase().includes(searchQuery.toLowerCase());

    const speakerThemes = parseThemes(s.themes);
    const matchesTheme = !selectedTheme || speakerThemes.includes(selectedTheme);

    return matchesSearch && matchesTheme;
  });

  const visibleSpeakers = speakers?.slice(0, displayCount);
  const hasMore = speakers ? displayCount < speakers.length : false;

  const handleThemeClick = (theme: string) => {
    setSelectedTheme(theme === selectedTheme ? null : theme);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="bg-primary py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
          Nos Conférenciers
        </h1>
        <p className="text-primary-foreground/80 max-w-2xl mx-auto">
          Découvrez notre sélection de {allSpeakers?.length ?? "..."} experts passionnants pour vos événements.
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 flex-grow">
        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 border-border/50 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Theme filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedTheme(null)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              !selectedTheme
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-muted-foreground border-border hover:border-accent/50"
            }`}
          >
            Tous
          </button>
          {allThemes.map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeClick(theme)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedTheme === theme
                  ? "ring-2 ring-accent ring-offset-1 " + getThemeColor(theme)
                  : getThemeColor(theme) + " hover:opacity-80"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : speakers?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Aucun conférencier ne correspond à votre recherche.</p>
            <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedTheme(null); }}>
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {visibleSpeakers?.map((speaker) => (
                <SpeakerCard key={speaker.id} speaker={speaker} onThemeClick={handleThemeClick} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
                  className="px-10 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Charger plus ({speakers!.length - displayCount} restants)
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-4">
              {Math.min(displayCount, speakers?.length ?? 0)} sur {speakers?.length} conférenciers affichés
            </p>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Speakers;
