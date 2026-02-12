
import Navbar from "@/components/Navbar";
import FeaturedSpeakers from "@/components/FeaturedSpeakers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1475721027767-f424029558d4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <span className="inline-block mb-4 px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase animate-fade-in">
            Agence de Conférenciers Premium
          </span>
          <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Trouvez l'inspiration pour <span className="text-accent italic">vos événements</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Des leaders d'opinion, des innovateurs et des visionnaires prêts à transformer votre audience.
          </p>
          
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
        </div>
      </section>

      {/* Featured Speakers Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2">Conférenciers à la Une</h2>
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
          <h2 className="text-2xl font-serif text-muted-foreground mb-12">Ils nous font confiance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale">
            {/* Placeholders for logos */}
            <div className="h-12 bg-muted rounded flex items-center justify-center">ENTREPRISE A</div>
            <div className="h-12 bg-muted rounded flex items-center justify-center">ENTREPRISE B</div>
            <div className="h-12 bg-muted rounded flex items-center justify-center">ENTREPRISE C</div>
            <div className="h-12 bg-muted rounded flex items-center justify-center">ENTREPRISE D</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
