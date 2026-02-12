
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Speakers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params);
  }, [searchQuery, setSearchParams]);

  const { data: speakers, isLoading } = useQuery({
    queryKey: ["speakers", searchQuery, selectedTheme],
    queryFn: async () => {
      let query = supabase.from("speakers").select("*");

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%,biography.ilike.%${searchQuery}%`);
      }

      if (selectedTheme) {
        query = query.contains("themes", [selectedTheme]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Speaker[];
    },
  });

  // Extract unique themes for filter
  const { data: allThemes } = useQuery({
    queryKey: ["all-themes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("speakers").select("themes");
      if (error) throw error;
      const themes = new Set<string>();
      data.forEach((s) => s.themes?.forEach((t) => themes.add(t)));
      return Array.from(themes).sort();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="bg-primary py-12 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-4">
          Nos Conférenciers
        </h1>
        <p className="text-primary-foreground/80 max-w-2xl mx-auto">
          Découvrez notre sélection d'experts passionnants pour vos événements.
        </p>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTheme === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTheme(null)}
            >
              Tous
            </Button>
            {allThemes?.map((theme) => (
              <Button
                key={theme}
                variant={selectedTheme === theme ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTheme(theme === selectedTheme ? null : theme)}
              >
                {theme}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[400px] w-full rounded-lg" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {speakers?.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Speakers;
