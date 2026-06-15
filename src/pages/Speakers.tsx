import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseThemes, getThemeColor } from "@/lib/parseThemes";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const PAGE_SIZE = 20;
const SCROLL_KEY = "speakers-scroll-pos";
const DISPLAY_COUNT_KEY = "speakers-display-count";

const PAGE_URL = "https://www.lesconferenciers.com/conferencier";
const PAGE_TITLE = "Trouver un conférencier pour votre événement, séminaire, kick-off, convention | Les Conférenciers";
const PAGE_DESCRIPTION =
  "Trouver un conférencier professionnel adapté à votre événement : 300+ profils experts, accompagnement sur mesure et devis rapide partout en France.";

type FaqItem = { question: string; answer: string };

const FALLBACK_FAQ: FaqItem[] = [
  { question: "Comment trouver un bon conférencier pour son événement ?", answer: "Définissez vos objectifs, votre audience et votre message clé. Une agence spécialisée vous fait gagner du temps en présélectionnant des profils adaptés." },
  { question: "Quel est le tarif d'un conférencier professionnel ?", answer: "Les honoraires varient selon la notoriété, l'expertise, la durée et le lieu. Comptez de quelques milliers d'euros à plusieurs dizaines de milliers d'euros pour des personnalités reconnues." },
  { question: "Combien de temps à l'avance faut-il réserver un conférencier ?", answer: "Idéalement 3 à 6 mois avant l'événement, jusqu'à 12 mois pour les profils très sollicités." },
  { question: "Quelle est la différence entre un conférencier, un intervenant et un keynote speaker ?", answer: "Le conférencier intervient sur une thématique précise, l'intervenant est un terme plus large, le keynote speaker est l'orateur principal d'un événement." },
  { question: "Comment choisir le conférencier adapté à son thème et à son audience ?", answer: "Vérifiez l'adéquation entre le message, le public et le style d'intervention." },
  { question: "Pourquoi passer par une agence pour trouver un conférencier ?", answer: "Une agence vous fait gagner du temps, sécurise la prestation et donne accès à un réseau qualifié." },
  { question: "Peut-on faire intervenir un conférencier en visio ou à l'étranger ?", answer: "Oui, les formats à distance et internationaux sont largement utilisés." },
  { question: "Que comprend la prestation d'un conférencier ?", answer: "Préparation en amont, intervention le jour J, échanges avec l'audience et frais de déplacement le cas échéant." },
];


const Speakers = () => {
  // SEO meta
  useEffect(() => {
    document.title = PAGE_TITLE;

    const ensureMeta = (selector: string, create: () => HTMLMetaElement, content: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    ensureMeta(
      'meta[name="description"]',
      () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        return m;
      },
      PAGE_DESCRIPTION,
    );

    ensureMeta(
      'meta[name="robots"]',
      () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "robots");
        return m;
      },
      "index, follow",
    );

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = PAGE_URL;

    const ogTags: { prop: string; content: string; twitter?: boolean }[] = [
      { prop: "og:title", content: PAGE_TITLE },
      { prop: "og:description", content: PAGE_DESCRIPTION },
      { prop: "og:url", content: PAGE_URL },
      { prop: "og:type", content: "website" },
      { prop: "twitter:card", content: "summary_large_image", twitter: true },
      { prop: "twitter:title", content: PAGE_TITLE, twitter: true },
      { prop: "twitter:description", content: PAGE_DESCRIPTION, twitter: true },
    ];
    ogTags.forEach(({ prop, content, twitter }) => {
      const selector = twitter ? `meta[name="${prop}"]` : `meta[property="${prop}"]`;
      ensureMeta(
        selector,
        () => {
          const m = document.createElement("meta");
          m.setAttribute(twitter ? "name" : "property", prop);
          return m;
        },
        content,
      );
    });

    const ldData = [
      {
        id: "ld-breadcrumb-speakers",
        json: {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.lesconferenciers.com/" },
            { "@type": "ListItem", position: 2, name: "Conférenciers", item: PAGE_URL },
          ],
        },
      },
    ];

    ldData.forEach(({ id, json }) => {
      let s = document.getElementById(id) as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement("script");
        s.type = "application/ld+json";
        s.id = id;
        document.head.appendChild(s);
      }
      s.textContent = JSON.stringify(json);
    });

    return () => {
      document.querySelector('link[rel="canonical"]')?.remove();
      ldData.forEach(({ id }) => document.getElementById(id)?.remove());
    };
  }, []);

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
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .eq("archived", false)
        .order("name", { ascending: true })
        .limit(500);
      if (error) throw error;
      const speakers = data as (Speaker & { display_order?: number })[];
      // Sort by display_order first, then by last name for those with default (999)
      speakers.sort((a, b) => {
        const aOrder = (a as any).display_order ?? 999;
        const bOrder = (b as any).display_order ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aLast = a.name.trim().split(/\s+/).pop()?.toLowerCase() || "";
        const bLast = b.name.trim().split(/\s+/).pop()?.toLowerCase() || "";
        return aLast.localeCompare(bLast, "fr");
      });
      return speakers;
    },
  });

  // FAQ items chargés depuis la base (éditables via l'admin)
  const { data: faqItems = FALLBACK_FAQ } = useQuery({
    queryKey: ["page-faq", "conferencier"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_faqs")
        .select("items")
        .eq("page_key", "conferencier")
        .maybeSingle();
      if (error) throw error;
      const items = (data?.items as FaqItem[] | null) ?? [];
      return items.length > 0 ? items : FALLBACK_FAQ;
    },
  });

  // Injecte le JSON-LD FAQPage dynamiquement quand les items changent
  useEffect(() => {
    const id = "ld-faq-speakers";
    let s = document.getElementById(id) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = id;
      document.head.appendChild(s);
    }
    s.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((it) => ({
        "@type": "Question",
        name: it.question,
        acceptedAnswer: { "@type": "Answer", text: it.answer },
      })),
    });
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [faqItems]);


  // Extract all themes sorted by frequency
  const { topThemes, allThemes } = (() => {
    if (!allSpeakers) return { topThemes: [], allThemes: [] };
    const counts = new Map<string, number>();
    allSpeakers.forEach((s) => {
      parseThemes(s.themes).forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

    const top10 = sorted.slice(0, 10).map(([theme]) => theme);
    const all = sorted.map(([theme]) => theme).sort((a, b) => a.localeCompare(b, "fr"));
    return { topThemes: top10, allThemes: all };
  })();

  const displayedThemes = showAllThemes ? allThemes : topThemes;

  // Filter speakers
  const speakers = allSpeakers?.filter((s) => {
    const matchesSearch =
      !searchQuery ||
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
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
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

      <section className="relative bg-primary py-12 px-4 text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://ibvjijamybwagxrniyjv.supabase.co/storage/v1/object/public/speaker-photos/og/lesconferenciers.jpg')] bg-cover bg-center"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
            Trouver un conférencier pour votre événement
          </h1>
          <p className="text-primary-foreground/80 max-w-4xl mx-auto text-lg font-normal whitespace-pre-line">
            {
              "Plus de 300 professionnels, experts et personnalités d'exception.\nTrouvez le conférencier idéal pour marquer votre séminaire, convention, kick-off"
            }
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 flex-grow">
        <p className="sr-only">
          Trouver un conférencier professionnel, un keynote speaker ou un intervenant expert pour vos événements
          d'entreprise, séminaires, conventions et conférences en France comme à l'international.
        </p>

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
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedTheme(null);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {visibleSpeakers?.map((speaker) => (
                <div key={speaker.id} className="speaker-card-container">
                  <SpeakerCard speaker={speaker} onThemeClick={handleThemeClick} onNavigate={saveScrollPosition} />
                </div>
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
          </>
        )}
      </main>

      {/* CTA block */}
      <div className="bg-muted/50 py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center bg-card rounded-2xl p-8 shadow-sm border border-border/30">
          <p className="text-foreground text-sm md:text-base leading-relaxed mb-6">
            <strong>Tous nos conférenciers ne sont pas présents sur le site.</strong> Vous cherchez un profil en
            particulier ? Contactez-nous pour une proposition personnalisée adaptée à votre événement.
          </p>
          <Button
            variant="outline"
            className="rounded-xl font-semibold gap-2 border-foreground/20 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
            onClick={() => (window.location.href = "/contact")}
          >
            Nous contacter <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>
      </div>

      {/* FAQ — SEO "trouver un conférencier" */}
      <section className="bg-background py-16 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-center tracking-tight">
            Questions fréquentes pour trouver un conférencier
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
            Tout ce qu'il faut savoir avant de réserver un conférencier pour votre événement.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-foreground">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Speakers;
