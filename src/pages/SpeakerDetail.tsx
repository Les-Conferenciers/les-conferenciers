
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Mail, ChevronRight, HelpCircle, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SpeakerReviews from "@/components/SpeakerReviews";

const DEFAULT_IMAGE = "https://www.lesconferenciers.com/wp-content/uploads/2022/05/thierry-marx-portrait.png";

const generateFAQ = (speaker: any) => {
  const themes = parseThemes(speaker.themes);
  const themesText = themes.length > 0 ? themes.slice(0, 3).join(", ") : "le leadership et le management";

  return [
    {
      question: `Quels sont les thèmes de conférence de ${speaker.name} ?`,
      answer: `${speaker.name} intervient principalement sur les thématiques suivantes : ${themesText}. Chaque conférence est adaptée au contexte et aux objectifs de votre événement.`,
    },
    {
      question: `Comment réserver ${speaker.name} pour un événement ?`,
      answer: `Pour réserver ${speaker.name}, contactez notre agence via le formulaire de contact ou par téléphone au 06 95 93 97 91. Nelly, votre interlocutrice dédiée, vous enverra un devis personnalisé sous 24 heures.`,
    },
    {
      question: `Quel est le tarif d'une conférence avec ${speaker.name} ?`,
      answer: `Le tarif dépend de plusieurs facteurs : la durée de l'intervention, le format (keynote, table ronde, atelier), le lieu et la date. Contactez-nous pour recevoir une proposition adaptée à votre budget.`,
    },
    {
      question: `${speaker.name} intervient-il en visioconférence ?`,
      answer: `Oui, ${speaker.name} peut intervenir en présentiel comme en visioconférence. Le format est adapté selon vos contraintes logistiques et le nombre de participants.`,
    },
    {
      question: `Quelle est la durée d'une conférence de ${speaker.name} ?`,
      answer: `La durée standard est de 45 minutes à 1h30, suivie d'un temps d'échange avec le public. Des formats plus courts ou plus longs sont possibles selon vos besoins.`,
    },
  ];
};

const SpeakerDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: speaker, isLoading } = useQuery({
    queryKey: ["speaker", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Similar speakers query
  const speakerThemes = speaker ? parseThemes(speaker.themes) : [];
  const { data: similarSpeakers } = useQuery({
    queryKey: ["similar-speakers", slug, speakerThemes],
    enabled: !!speaker && speakerThemes.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .neq("slug", slug)
        .limit(200);

      if (error) throw error;

      // Score by theme overlap
      const scored = (data as Speaker[])
        .map((s) => {
          const sThemes = parseThemes(s.themes);
          const overlap = sThemes.filter((t) => speakerThemes.includes(t)).length;
          return { ...s, score: overlap };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      return scored;
    },
  });

  // SEO: JSON-LD + meta
  useEffect(() => {
    if (speaker) {
      document.title = speaker.seo_title || `${speaker.name} — Conférencier | Les Conférenciers`;
      const desc = speaker.meta_description || `Réservez ${speaker.name} pour votre événement. ${speaker.role || "Conférencier professionnel"}.`;
      let metaEl = document.querySelector('meta[name="description"]');
      if (metaEl) {
        metaEl.setAttribute("content", desc);
      } else {
        metaEl = document.createElement("meta");
        metaEl.setAttribute("name", "description");
        metaEl.setAttribute("content", desc);
        document.head.appendChild(metaEl);
      }

      // JSON-LD structured data
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: speaker.name,
        jobTitle: speaker.role,
        description: desc,
        image: speaker.image_url || DEFAULT_IMAGE,
        url: window.location.href,
        knowsAbout: parseThemes(speaker.themes),
      };
      let scriptEl = document.querySelector('script[data-jsonld="speaker"]');
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.setAttribute("type", "application/ld+json");
        scriptEl.setAttribute("data-jsonld", "speaker");
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);

      // FAQ JSON-LD
      const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: generateFAQ(speaker).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      };
      let faqScriptEl = document.querySelector('script[data-jsonld="faq"]');
      if (!faqScriptEl) {
        faqScriptEl = document.createElement("script");
        faqScriptEl.setAttribute("type", "application/ld+json");
        faqScriptEl.setAttribute("data-jsonld", "faq");
        document.head.appendChild(faqScriptEl);
      }
      faqScriptEl.textContent = JSON.stringify(faqJsonLd);

      return () => {
        document.querySelector('script[data-jsonld="speaker"]')?.remove();
        document.querySelector('script[data-jsonld="faq"]')?.remove();
      };
    }
  }, [speaker]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="bg-primary py-16 px-4">
          <div className="container mx-auto max-w-5xl flex items-center gap-8">
            <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
            <div className="space-y-3 flex-grow">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Conférencier non trouvé</h1>
            <Button onClick={() => navigate("/speakers")}>Retour à la liste</Button>
          </div>
        </div>
      </div>
    );
  }

  const themes = parseThemes(speaker.themes);
  const faqItems = generateFAQ(speaker);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-primary-foreground/60 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-accent transition-colors">Accueil</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/speakers" className="hover:text-accent transition-colors">Conférenciers</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary-foreground font-medium">{speaker.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Medallion */}
            <div className="flex-shrink-0">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-accent/30 shadow-2xl">
                <img
                  src={speaker.image_url || DEFAULT_IMAGE}
                  alt={speaker.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2 leading-tight">
                {speaker.name}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/70 font-medium mb-5">
                {speaker.role}
              </p>

              {/* Themes */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => navigate(`/speakers?theme=${encodeURIComponent(theme)}`)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${getThemeColor(theme)}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>

              {/* Key Points inline */}
              {speaker.key_points && speaker.key_points.length > 0 && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start">
                  {speaker.key_points.slice(0, 4).map((point: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                      <Check className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              <div className="mt-8 flex justify-center md:justify-start">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-2 px-8 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigate(`/contact?speaker=${encodeURIComponent(speaker.name)}`)}
                >
                  <Mail className="h-5 w-5" />
                  Solliciter {speaker.name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Biography */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-1 h-7 bg-accent rounded-full block"></span>
                Biographie
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                {speaker.biography?.split("\n").map((paragraph: string, idx: number) => (
                  <p key={idx} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Key Points full */}
            {speaker.key_points && speaker.key_points.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="w-1 h-7 bg-accent rounded-full block"></span>
                  Points Clés
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {speaker.key_points.map((point: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/40 hover:border-accent/30 transition-colors"
                    >
                      <div className="mt-0.5 bg-accent/10 p-1.5 rounded-full flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <span className="font-medium text-foreground text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-1 h-7 bg-accent rounded-full block"></span>
                Questions fréquentes
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {faqItems.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="border border-border/40 rounded-xl px-5 data-[state=open]:border-accent/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Reviews */}
            <SpeakerReviews speakerId={speaker.id} speakerName={speaker.name} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* CTA Card */}
            <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg sticky top-24">
              <h3 className="font-serif font-bold text-lg mb-2">Intéressé par ce profil ?</h3>
              <p className="text-primary-foreground/70 text-sm mb-5">
                Contactez-nous pour vérifier la disponibilité de {speaker.name} pour votre événement.
              </p>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-2"
                onClick={() => navigate("/contact")}
              >
                <Mail className="h-4 w-4" /> Demander un devis
              </Button>
              <p className="text-center text-xs text-primary-foreground/50 mt-3">
                Devis gratuit sous 24h
              </p>
            </div>

            {/* Formats */}
            <div className="bg-card border border-border/40 rounded-2xl p-6">
              <h3 className="font-serif font-bold text-foreground mb-3">Formats d'intervention</h3>
              <div className="space-y-2">
                {["Keynote", "Table ronde", "Atelier", "Visioconférence"].map((format) => (
                  <div key={format} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span>{format}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Themes sidebar */}
            {themes.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="font-serif font-bold text-foreground mb-3">Thématiques</h3>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => navigate(`/speakers?theme=${encodeURIComponent(theme)}`)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${getThemeColor(theme)}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Similar Speakers */}
        {similarSpeakers && similarSpeakers.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
              <span className="w-1 h-7 bg-accent rounded-full block"></span>
              Profils similaires
            </h2>
            <p className="text-muted-foreground mb-8 ml-4">
              Des conférenciers qui partagent des thématiques communes avec {speaker.name}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarSpeakers.map((s) => (
                <SpeakerCard key={s.id} speaker={s} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SpeakerDetail;
