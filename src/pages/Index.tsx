
import Navbar from "@/components/Navbar";
import FeaturedSpeakers from "@/components/FeaturedSpeakers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, HeartHandshake, Zap, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const REASSURANCE = [
  { icon: HeartHandshake, label: "Accompagnement sur mesure" },
  { icon: Zap, label: "Réactivité" },
  { icon: Clock, label: "Disponibilité" },
  { icon: Sparkles, label: "Enthousiasme" },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/speakers?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-24 md:py-36 px-4 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1475721027767-f424029558d4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <span className="inline-block mb-6 px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase animate-fade-in">
            Agence de Conférenciers Premium
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Agence de conférenciers
            <br />
            <span className="text-accent italic">et de célébrités</span>
          </h1>

          <h2 className="text-lg md:text-2xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto font-normal animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Trouvez le conférencier idéal pour vos événements professionnels.
          </h2>

          {/* Rating */}
          <div className="flex items-center justify-center gap-2 mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i <= 4 ? "fill-accent text-accent" : "fill-accent/50 text-accent/50"}`}
                />
              ))}
            </div>
            <span className="text-primary-foreground font-semibold text-lg">4,7/5</span>
            <span className="text-primary-foreground/60 text-sm">— avis clients</span>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Rechercher par nom, thème ou expertise..."
                className="pl-10 h-12 bg-background text-foreground border-none shadow-lg text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg">
              Rechercher
            </Button>
          </form>

          {/* Reassurance */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {REASSURANCE.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-primary-foreground/70">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-xs md:text-sm font-medium tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Speakers Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Conférenciers à la Une</h2>
              <p className="text-muted-foreground">Les profils les plus demandés du moment</p>
            </div>
            <Button variant="outline" className="hidden md:flex" onClick={() => navigate('/speakers')}>
              Voir tous les conférenciers
            </Button>
          </div>

          <FeaturedSpeakers />

          <div className="mt-12 text-center md:hidden">
            <Button variant="outline" className="w-full" onClick={() => navigate('/speakers')}>
              Voir tous les conférenciers
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl text-muted-foreground mb-12">Ils nous font confiance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale">
            <div className="h-12 bg-muted rounded flex items-center justify-center text-sm font-medium">ENTREPRISE A</div>
            <div className="h-12 bg-muted rounded flex items-center justify-center text-sm font-medium">ENTREPRISE B</div>
            <div className="h-12 bg-muted rounded flex items-center justify-center text-sm font-medium">ENTREPRISE C</div>
            <div className="h-12 bg-muted rounded flex items-center justify-center text-sm font-medium">ENTREPRISE D</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
