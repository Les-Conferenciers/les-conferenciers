
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedSpeakers from "@/components/FeaturedSpeakers";
import LogoCarousel from "@/components/LogoCarousel";
import ValueProposition from "@/components/ValueProposition";
import GoogleReviews from "@/components/GoogleReviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, ArrowRight, Users, Award, Calendar } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STATS = [
  { icon: Users, value: "161+", label: "Conférenciers" },
  { icon: Award, value: "500+", label: "Événements" },
  { icon: Calendar, value: "10+", label: "Années d'expérience" },
  { icon: Star, value: "5/5", label: "Note Google" },
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
      <section className="relative py-28 md:py-40 px-4 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://www.lesconferenciers.com/wp-content/uploads/2022/09/lesconferenciers.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <span className="inline-block mb-6 px-5 py-2 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase animate-fade-in">
            Agence de Conférenciers Premium
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Agence de conférenciers
            <br />
            <span className="text-accent italic">et de célébrités</span>
          </h1>

          <h2 className="text-lg md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto font-normal animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Trouvez le conférencier idéal pour vos événements professionnels.
            <br className="hidden md:block" />
            Accompagnement sur mesure · Réactivité · Disponibilité
          </h2>

          {/* Rating */}
          <div className="flex items-center justify-center gap-2 mb-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-primary-foreground font-semibold text-lg">5/5</span>
            <span className="text-primary-foreground/60 text-sm">— 54 avis Google</span>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Rechercher par nom, thème ou expertise..."
                className="pl-10 h-14 bg-background text-foreground border-none shadow-lg text-lg rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg rounded-xl">
              Rechercher
            </Button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card rounded-2xl shadow-xl border border-border/40 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-8 px-4">
                <Icon className="h-6 w-6 text-accent mb-1" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{value}</span>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo Carousel */}
      <LogoCarousel />

      {/* Value Proposition */}
      <ValueProposition />

      {/* Nelly - Votre interlocutrice */}
      <section className="py-20 px-4 bg-card border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-10 items-center">
            {/* Image - compact vertical */}
            <div className="lg:col-span-2">
              <div className="max-w-[280px] mx-auto">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-border/40">
                  <img
                    src="https://emmalamagicienne.fr/wp-content/uploads/2017/03/emma.png"
                    alt="Nelly, votre interlocutrice dédiée"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="font-serif font-bold text-foreground">Nelly</p>
                  <p className="text-sm text-accent font-semibold">Votre interlocutrice dédiée</p>
                </div>
              </div>
            </div>
            {/* Text */}
            <div className="lg:col-span-3 space-y-6">
              <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase">
                Accompagnement personnalisé
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Un accompagnement <span className="text-accent italic">sur mesure</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                De la sélection du conférencier idéal à la coordination le jour J, Nelly est votre interlocutrice unique. Son expertise et sa connaissance approfondie de chaque intervenant garantissent un événement à la hauteur de vos ambitions.
              </p>
              <ul className="space-y-3">
                {[
                  "Conseil personnalisé selon vos objectifs",
                  "Devis détaillé sous 24 heures",
                  "Coordination logistique complète",
                  "Suivi post-événement",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl mt-4"
                onClick={() => navigate('/contact')}
              >
                Contacter Nelly
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Speakers Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">Conférenciers à la Une</h2>
              <p className="text-muted-foreground">Les profils les plus demandés du moment</p>
            </div>
            <Button
              variant="outline"
              className="hidden md:flex gap-2"
              onClick={() => navigate('/speakers')}
            >
              Voir tous <ArrowRight className="h-4 w-4" />
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

      {/* Google Reviews */}
      <GoogleReviews />

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Prêt à marquer les esprits ?
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8">
            Contactez-nous pour trouver le conférencier qui transformera votre événement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-10 rounded-xl"
              onClick={() => navigate('/contact')}
            >
              Demander un devis gratuit
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl"
              onClick={() => navigate('/speakers')}
            >
              Découvrir nos conférenciers
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
