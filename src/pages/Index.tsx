import speakersCollage1 from "@/assets/speakers-collage-1.png";
import speakersCollage2 from "@/assets/speakers-collage-2.png";
import nellySelfies from "@/assets/nelly-selfies.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedSpeakers from "@/components/FeaturedSpeakers";
import LogoCarousel from "@/components/LogoCarousel";
import ValueProposition from "@/components/ValueProposition";
import GoogleReviews from "@/components/GoogleReviews";
import WhyChooseUs from "@/components/WhyChooseUs";
import { Button } from "@/components/ui/button";
import {
  Star,
  ArrowRight,
  Users,
  Award,
  Calendar,
  Sparkles,
  Clock,
  HeartHandshake,
  HelpCircle,
  ShieldCheck,
  MessageCircle,
  UserCheck,
  Zap,
  BookOpen } from
"lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseThemes } from "@/lib/parseThemes";

const Index = () => {
  const [speakerCount, setSpeakerCount] = useState(0);
  const [topThemes, setTopThemes] = useState<string[]>([]);
  const navigate = useNavigate();

  // SEO: structured data for home page
  useEffect(() => {
    document.title = "Agence de conférenciers et de célébrités | Les Conférenciers";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Nous vous aidons à trouver le conférencier idéal pour vos événements professionnels. Accompagnement sur mesure | Réactivité | Disponibilité | Enthousiasme"
      );
    }

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = "https://www.lesconferenciers.com/";

    const organizationJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.lesconferenciers.com/#organization",
      name: "Les Conférenciers",
      alternateName: "LES CONFERENCIERS - LES CONFERENCIERS.COM",
      url: "https://www.lesconferenciers.com",
      logo: "https://www.lesconferenciers.com/images/les-conferenciers-banniere.png",
      description: "Agence de conférenciers et de célébrités pour vos événements professionnels.",
      telephone: "+33695939791",
      email: "contact@lesconferenciers.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "4 B Villa de la Gare",
        addressLocality: "Clamart",
        postalCode: "92140",
        addressCountry: "FR"
      },
      sameAs: ["https://www.google.com/search?q=lesconferenciers.com+avis"],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        bestRating: "5",
        worstRating: "1",
        ratingCount: "105",
        reviewCount: "105"
      }
    };

    const websiteJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.lesconferenciers.com/#website",
      name: "Les Conférenciers",
      url: "https://www.lesconferenciers.com",
      publisher: { "@id": "https://www.lesconferenciers.com/#organization" }
    };

    const localBusinessJsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": "https://www.lesconferenciers.com/#localbusiness",
      name: "Les Conférenciers",
      image: "https://www.lesconferenciers.com/images/les-conferenciers-banniere.png",
      telephone: "+33695939791",
      email: "contact@lesconferenciers.com",
      url: "https://www.lesconferenciers.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "4 B Villa de la Gare",
        addressLocality: "Clamart",
        postalCode: "92140",
        addressCountry: "FR"
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        bestRating: "5",
        worstRating: "1",
        ratingCount: "105",
        reviewCount: "105"
      },
      priceRange: "€€€"
    };

    const schemas = [
    { key: "organization", data: organizationJsonLd },
    { key: "website", data: websiteJsonLd },
    { key: "localbusiness", data: localBusinessJsonLd }];


    schemas.forEach(({ key, data }) => {
      let el = document.querySelector(`script[data-jsonld="${key}"]`);
      if (!el) {
        el = document.createElement("script");
        el.setAttribute("type", "application/ld+json");
        el.setAttribute("data-jsonld", key);
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    });

    return () => {
      schemas.forEach(({ key }) => {
        document.querySelector(`script[data-jsonld="${key}"]`)?.remove();
      });
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data, count } = await supabase.
      from("speakers").
      select("themes", { count: "exact" }).
      eq("archived", false).
      limit(500);
      setSpeakerCount(count || 0);

      // Extract top themes for category search
      if (data) {
        const counts = new Map<string, number>();
        data.forEach((s: any) => {
          parseThemes(s.themes).forEach((t: string) => {
            counts.set(t, (counts.get(t) || 0) + 1);
          });
        });
        const sorted = Array.from(counts.entries()).
        sort((a, b) => b[1] - a[1]).
        slice(0, 12).
        map(([theme]) => theme);
        setTopThemes(sorted);
      }
    };
    fetchData();
  }, []);

  const STATS = [
  { icon: Users, value: "300+", label: "Conférenciers" },
  { icon: Award, value: "500+", label: "Événements" },
  { icon: Clock, value: "24h", label: "Temps de réponse" },
  { icon: Star, value: "5/5", label: "Note Google" }];


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-28 md:py-40 px-4 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://www.lesconferenciers.com/wp-content/uploads/2022/09/lesconferenciers.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          

          

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight animate-fade-in"
            style={{ animationDelay: "0.1s" }}>
            
            Agence de conférenciers
            <br />
            <span className="text-accent italic">et de célébrités</span>
          </h1>

          <h2
            className="text-lg md:text-2xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto font-normal animate-fade-in"
            style={{ animationDelay: "0.2s" }}>
            
            Gagnez du temps, trouvez le conférencier idéal pour vos événements professionnels.
          </h2>

          {/* Reassurance pills */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 mb-10 animate-fade-in"
            style={{ animationDelay: "0.25s" }}>
            
            {[
            { icon: HeartHandshake, label: "Un seul interlocuteur dédié" },
            { icon: Clock, label: "Réponse garantie sous 24h" },
            { icon: Sparkles, label: "Événement sécurisé de A à Z" }].
            map(({ icon: Icon, label }) =>
            <span
              key={label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-sm text-primary-foreground/90 backdrop-blur-sm">
              
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </span>
            )}
          </div>

          {/* CTA mobile only - above the fold */}
          <div className="md:hidden flex justify-center mb-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button
              size="lg"
              onClick={() => navigate("/contact")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-8 py-3 rounded-full shadow-lg">
              
              Demander un devis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Rating */}
          <div
            className="flex items-center justify-center gap-2 mb-10 animate-fade-in"
            style={{ animationDelay: "0.25s" }}>
            
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) =>
              <Star key={i} className="h-5 w-5 fill-accent text-accent" />
              )}
            </div>
            <span className="text-primary-foreground font-semibold text-lg">5/5</span>
            
          </div>

          {/* Category search (rubriques only, no name search) */}
          <div
            className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.3s" }}>
            
            {topThemes.map((theme) =>
            <button
              key={theme}
              onClick={() => navigate(`/conferencier?theme=${encodeURIComponent(theme)}`)}
              className="px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm text-primary-foreground/90 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200">
              
                {theme}
              </button>
            )}
            <button
              onClick={() => navigate("/conferencier")}
              className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-all duration-200">
              
              Tous les conférenciers →
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card rounded-2xl shadow-xl border border-border/40 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
            {STATS.map(({ icon: Icon, value, label }) =>
            <div key={label} className="flex flex-col items-center gap-1 py-8 px-4">
                <Icon className="h-6 w-6 text-accent mb-1" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{value}</span>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Logo Carousel */}
      <LogoCarousel />

      {/* Trouvez l'orateur idéal */}
      <section className="py-24 px-4 bg-primary text-primary-foreground overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — Text */}
            <div>
              <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase mb-5">
                Le constat
              </span>
              <h2 className="text-3xl font-serif font-bold leading-tight mb-10 md:text-4xl">
                Trouvez l'orateur idéal
                <br />
                <span className="text-accent italic">n'est pas chose aisée</span>
              </h2>

              <div className="space-y-6">
                {/* Pain 1 */}
                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-primary-foreground mb-1">
                      Votre temps est précieux
                    </h3>
                    <p className="text-primary-foreground/60 leading-relaxed text-sm">
                      S'informer, comparer, gérer la logistique… Tout ceci est{" "}
                      <strong className="text-primary-foreground/90">chronophage</strong>. Concentrez-vous sur
                      l'essentiel.
                    </p>
                  </div>
                </div>

                {/* Pain 2 */}
                <div className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <HelpCircle className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-primary-foreground mb-1">
                      Le bon choix est crucial
                    </h3>
                    <p className="text-primary-foreground/60 leading-relaxed text-sm">
                      Des centaines d'experts aux personnalités différentes.{" "}
                      <strong className="text-primary-foreground/90">
                        Comment choisir celui qui marquera les esprits ?
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-3">
                <div className="h-px flex-grow bg-primary-foreground/10" />
                <span className="text-primary-foreground/40 text-sm font-medium italic">
                  C'est la raison pour laquelle nous vous accompagnons.
                </span>
                <div className="h-px flex-grow bg-primary-foreground/10" />
              </div>
            </div>

            {/* Right — Image collage */}
            <div className="relative hidden lg:block">
              <div className="relative">
                <img
                  src={speakersCollage1}
                  alt="Sélection de conférenciers stars"
                  className="w-full rounded-2xl shadow-2xl border border-primary-foreground/10" />
                

                {/* Floating second image */}
                <div className="absolute -bottom-8 -left-8 w-2/3">
                  <img
                    src={speakersCollage2}
                    alt="Nos intervenants d'exception"
                    className="rounded-2xl shadow-2xl border-4 border-primary" />
                  
                </div>
                {/* Badge */}
                <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl shadow-lg font-bold text-sm">
                  300+ profils vérifiés
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <ValueProposition />

      {/* Nelly - Votre interlocutrice */}
      <section className="py-20 px-4 bg-card border-y border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-5 gap-10 items-center">
            {/* Image - compact vertical */}
            <div className="lg:col-span-2">
              <div className="max-w-[320px] mx-auto">
                <img
                  src={nellySelfies}
                  alt="Nelly avec des conférenciers lors d'événements"
                  className="w-full rounded-2xl shadow-lg border border-border/40" />
                
                <div className="text-center mt-4">
                  <p className="font-serif font-bold text-foreground">Nelly</p>
                  <p className="text-sm text-accent font-semibold">Fondatrice de l'agence</p>
                </div>
              </div>
            </div>
            {/* Text */}
            <div className="lg:col-span-3 space-y-6">
              <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase">
                Accompagnement sur mesure
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                Arrêtez de perdre du temps,
                <br />
                <span className="text-accent italic">on s'occupe de tout.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Trouver le bon conférencier est <strong className="text-foreground">chronophage</strong> : recherches,
                comparaisons, négociations, logistique… Nelly accompagne les entreprises pour leur faire{" "}
                <strong className="text-foreground">gagner du temps</strong> et{" "}
                <strong className="text-foreground">sécuriser chaque étape</strong> de l'organisation.
              </p>

              <ul className="space-y-3">
                {[
                "Un seul interlocuteur — relation directe et personnalisée",
                "Devis détaillé sous 24 heures",
                "Coordination logistique complète, de A à Z",
                "Suivi personnalisé avant, pendant et après l'événement"].
                map((item) =>
                <li key={item} className="flex items-center gap-3 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg
                      className="w-3.5 h-3.5 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}>
                      
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                )}
              </ul>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl mt-4"
                onClick={() => navigate("/contact")}>
                
                Contacter Nelly
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Différenciateur — Ce qui nous rend uniques */}
      <section className="py-16 px-4 bg-background border-b border-border/40">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase mb-4">
              Ce qui nous différencie
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Pourquoi passer par <span className="text-accent italic">Les Conférenciers</span> ?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Beaucoup de nos clients nous posent cette question. Voici la réponse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
            {
              icon: UserCheck,
              title: "Une seule interlocutrice",
              description:
              "Pas de plateforme anonyme, pas de turnover. Nelly gère votre projet de A à Z. Relation directe, personnalisée et sans intermédiaire."
            },
            {
              icon: Zap,
              title: "Réactivité et disponibilité",
              description:
              "Tous les mails sont traités dans la journée. Vous recevez un devis détaillé sous 24h avec des profils adaptés à votre brief."
            },
            {
              icon: BookOpen,
              title: "Connaissance approfondie des profils",
              description:
              "Notre grande connaissance des interventions de chaque conférencier nous permet de vous proposer le profil idéal, parfaitement adapté à vos besoins."
            }].
            map((item) =>
            <div
              key={item.title}
              className="p-7 rounded-2xl bg-card border border-border/40 hover:border-accent/40 hover:shadow-xl transition-all duration-300 text-center group">
              
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent/20 group-hover:scale-110 transition-all">
                  <item.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Speakers Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">Conférenciers inspirants à découvrir</h2>
              <p className="text-muted-foreground">
                Thierry Marx, Nina Métayer, Tony Estanguet, Julia de Funès… et bien d'autres
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex gap-2" onClick={() => navigate("/conferencier")}>
              Voir tous <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <FeaturedSpeakers />

          {/* Mention: not all speakers are listed */}
          <div className="mt-10 text-center bg-card border border-border/40 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">Tous nos conférenciers ne sont pas présents sur le site.</strong> Vous
              cherchez un profil en particulier ? Contactez-nous pour une proposition personnalisée adaptée à votre
              événement.
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/contact")}>
              Nous contacter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" className="w-full" onClick={() => navigate("/conferencier")}>
              Voir tous les conférenciers
            </Button>
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviews />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Prêt à marquer les esprits ?</h2>
          <p className="text-primary-foreground/70 text-lg mb-8">
            Contactez-nous pour trouver le conférencier qui transformera votre événement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-10 rounded-xl"
              onClick={() => navigate("/contact")}>
              
              Demander un devis gratuit
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-accent/50 text-accent hover:bg-accent/10 rounded-xl font-semibold"
              onClick={() => navigate("/conferencier")}>
              
              Découvrir nos conférenciers
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;