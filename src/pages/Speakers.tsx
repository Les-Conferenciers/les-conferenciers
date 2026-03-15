
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";

const PAGE_SIZE = 20;
const SCROLL_KEY = "speakers-scroll-pos";
const DISPLAY_COUNT_KEY = "speakers-display-count";

const Speakers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialTheme = searchParams.get("theme") || null;
  const savedDisplayCount = sessionStorage.getItem(DISPLAY_COUNT_KEY);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(initialTheme);
  const [displayCount, setDisplayCount] = useState(savedDisplayCount ? parseInt(savedDisplayCount, 10) : PAGE_SIZE);
  const [showAllThemes, setShowAllThemes] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedTheme) params.set("theme", selectedTheme);
    setSearchParams(params);
  }, [searchQuery, selectedTheme, setSearchParams]);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    sessionStorage.removeItem(SCROLL_KEY);
    sessionStorage.removeItem(DISPLAY_COUNT_KEY);
  }, [searchQuery, selectedTheme]);

  const { data: allSpeakers, isLoading } = useQuery({
    queryKey: ["speakers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("speakers").select("*").eq("archived", false).order("name", { ascending: true }).limit(500);
      if (error) throw error;
      // Sort by last name
      const speakers = data as Speaker[];
      speakers.sort((a, b) => {
        const aLast = a.name.trim().split(/\s+/).pop()?.toLowerCase() || "";
        const bLast = b.name.trim().split(/\s+/).pop()?.toLowerCase() || "";
        return aLast.localeCompare(bLast, "fr");
      });
      return speakers;
    },
  });

  // Extract all themes sorted by frequency
  const { topThemes, allThemes } = (() => {
    if (!allSpeakers) return { topThemes: [], allThemes: [] };
    const counts = new Map<string, number>();
    allSpeakers.forEach((s) => {
      parseThemes(s.themes).forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const top10 = sorted.slice(0, 10).map(([theme]) => theme);
    const all = sorted.map(([theme]) => theme).sort((a, b) => a.localeCompare(b, "fr"));
    return { topThemes: top10, allThemes: all };
  })();

  const displayedThemes = showAllThemes ? allThemes : topThemes;

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

  // Save displayCount to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(DISPLAY_COUNT_KEY, String(displayCount));
  }, [displayCount]);

  // Restore scroll position after speakers are rendered
  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (hasRestoredScroll.current || !visibleSpeakers?.length) return;
    const savedPos = sessionStorage.getItem(SCROLL_KEY);
    if (savedPos) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedPos, 10));
      });
    }
  }, [visibleSpeakers]);

  // Save scroll position before navigating to a speaker
  const saveScrollPosition = useCallback(() => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  }, []);

  // Infinite scroll via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => {
    if (hasMore) setDisplayCount((prev) => prev + PAGE_SIZE);
  }, [hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleThemeClick = (theme: string) => {
    setSelectedTheme(theme === selectedTheme ? null : theme);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="bg-primary py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
          Conférenciers professionnels pour vos événements
        </h1>
        <h2 className="text-primary-foreground/80 max-w-2xl mx-auto text-lg font-normal">
          Parmi nos 300 conférenciers et intervenants d'exception, trouvez celui qui marquera votre événement.
        </h2>
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
        <div className="flex flex-wrap gap-2 mb-4">
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
          {displayedThemes.map((theme) => (
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

        {/* Show all / less toggle */}
        {allThemes.length > 10 && (
          <div className="mb-10">
            <button
              onClick={() => setShowAllThemes(!showAllThemes)}
              className="text-sm text-accent font-semibold hover:underline inline-flex items-center gap-1"
            >
              {showAllThemes ? "Voir moins de catégories" : `Voir toutes les catégories (${allThemes.length})`}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAllThemes ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {!showAllThemes && allThemes.length <= 10 && <div className="mb-10" />}

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
                <SpeakerCard key={speaker.id} speaker={speaker} onThemeClick={handleThemeClick} onNavigate={saveScrollPosition} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Chargement…
                </div>
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
