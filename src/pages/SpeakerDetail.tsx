
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, Mail, ChevronRight, HelpCircle, ChevronDown, Target, Lightbulb, TrendingUp, Handshake, Globe, Mic, Sparkles } from "lucide-react";
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

const generateWhyReasons = (speaker: any) => {
  const themes = parseThemes(speaker.themes);
  const themesText = themes.length > 0 ? themes.slice(0, 2).join(" et ") : "son domaine";

  return [
    {
      icon: Target,
      title: "Expertise reconnue",
      description: `${speaker.name} est un expert reconnu en ${themesText}, apportant une vision concrète et actionnable à chaque intervention.`,
    },
    {
      icon: Lightbulb,
      title: "Contenu inspirant et sur-mesure",
      description: `Chaque conférence est personnalisée en fonction de votre audience et de vos objectifs pour maximiser l'impact et l'engagement.`,
    },
    {
      icon: TrendingUp,
      title: "Impact mesurable",
      description: `Les interventions de ${speaker.name} génèrent un réel retour sur investissement : motivation des équipes, nouvelles perspectives et dynamique positive.`,
    },
    {
      icon: Handshake,
      title: "Accompagnement professionnel",
      description: `Notre agence assure un suivi complet : de la préparation du brief à la coordination le jour J, pour un événement sans fausse note.`,
    },
  ];
};

const highlightBioKeywords = (text: string): string => {
  // Bold patterns: years, numbers with units, quoted text, proper nouns patterns, strong phrases
  const patterns = [
    /(\d{4})/g, // years
    /(\d+[\s]?(ans|pays|millions?|milliards?|livres?|ouvrages?|médailles?|records?|émissions?|entreprises?|collaborateurs?|salariés?))/gi,
    /(champion(?:ne)?|record|prix|médaille|oscar|césar|palme|trophée|étoile|michelin|meilleur ouvrier|ballon d'or|victoire)/gi,
    /(n°\s?\d+|numéro \d+|premier(?:e)?|première)/gi,
  ];
  
  let result = text;
  patterns.forEach(pattern => {
    result = result.replace(pattern, '<strong class="text-foreground font-semibold">$&</strong>');
  });
  return result;
};

const SpeakerDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [bioExpanded, setBioExpanded] = useState(false);

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

  // Conferences query
  const { data: conferences } = useQuery({
    queryKey: ["speaker-conferences", speaker?.id],
    enabled: !!speaker?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speaker_conferences")
        .select("*")
        .eq("speaker_id", speaker!.id)
        .order("display_order", { ascending: true });
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
  const whyReasons = generateWhyReasons(speaker);

  // Biography: show 3 lines by default
  const bioParagraphs = speaker.biography?.split("\n").filter(Boolean) || [];
  const bioPreview = bioParagraphs.slice(0, 2);
  const hasMoreBio = bioParagraphs.length > 2;

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
                Conférence {speaker.name}
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

            {/* Conferences */}
            {conferences && conferences.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="w-1 h-7 bg-accent rounded-full block"></span>
                  Les thèmes de conférence de {speaker.name}
                </h2>
                <div className="space-y-5">
                  {conferences.map((conf) => (
                    <div
                      key={conf.id}
                      className="rounded-xl bg-card border border-border/40 hover:border-accent/30 transition-colors overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-6 py-4 bg-primary/[0.03] border-b border-border/30">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Mic className="h-4 w-4 text-accent" />
                        </div>
                        <h3 className="font-serif font-bold text-foreground text-lg">
                          Conférence « {conf.title} »
                        </h3>
                      </div>
                      <div className="p-6 space-y-4">
                        {conf.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed">{conf.description}</p>
                        )}
                        {conf.bullet_points && conf.bullet_points.length > 0 && (
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {conf.bullet_points.map((point: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {conf.bonus && (
                          <div className="flex items-start gap-2 bg-accent/5 border border-accent/15 rounded-lg px-4 py-3">
                            <Sparkles className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground font-medium">{conf.bonus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Biography with "Qui est" heading */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-1 h-7 bg-accent rounded-full block"></span>
                Biographie de {speaker.name} — Conférencier
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                {(bioExpanded ? bioParagraphs : bioPreview).map((paragraph: string, idx: number) => (
                  <p key={idx} className="mb-4" dangerouslySetInnerHTML={{ __html: highlightBioKeywords(paragraph) }} />
                ))}
              </div>
              {hasMoreBio && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-accent font-semibold text-sm hover:underline mt-2 inline-flex items-center gap-1"
                >
                  {bioExpanded ? "Voir moins" : "Lire la suite"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${bioExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </section>

            {/* Why choose this speaker */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-1 h-7 bg-accent rounded-full block"></span>
                Pourquoi réserver la conférence de {speaker.name} ?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whyReasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-card border border-border/40 hover:border-accent/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                      <reason.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-serif font-bold text-foreground mb-2">{reason.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{reason.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Key Points full */}
            {speaker.key_points && speaker.key_points.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="w-1 h-7 bg-accent rounded-full block"></span>
                  Ce qui distingue les conférences de {speaker.name}
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
                Questions fréquentes sur la conférence de {speaker.name}
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

            {/* Languages */}
            {speaker.languages && speaker.languages.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  Langues d'intervention
                </h3>
                <div className="flex flex-wrap gap-2">
                  {speaker.languages.map((lang: string) => (
                    <span
                      key={lang}
                      className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 text-accent px-3 py-1 text-xs font-semibold"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
              Conférenciers similaires à {speaker.name}
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
