
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpeakerCard, { Speaker } from "@/components/SpeakerCard";
import { Button } from "@/components/ui/button";
import { Check, Mail, ChevronRight, ChevronDown, Target, Lightbulb, TrendingUp, Handshake, Globe, Mic, Sparkles, Play, Users, User } from "lucide-react";
import nuggetIcon from "@/assets/nugget.png";
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

const DEFAULT_IMAGE = null;

// Gender helpers
const isFemale = (speaker: any) => speaker.gender === "female";
const pronoun = (speaker: any) => isFemale(speaker) ? "elle" : "il";
const pronounCap = (speaker: any) => isFemale(speaker) ? "Elle" : "Il";
const le_la = (speaker: any) => isFemale(speaker) ? "la" : "le";
const ce_cette = (speaker: any) => isFemale(speaker) ? "cette" : "ce";
const expert_e = (speaker: any) => isFemale(speaker) ? "experte" : "expert";
const reconnu_e = (speaker: any) => isFemale(speaker) ? "reconnue" : "reconnu";
const conferencier_e = (speaker: any) => isFemale(speaker) ? "conférencière" : "conférencier";

// Check if biography mentions books/ouvrages
const hasPublishedBooks = (biography: string | null): boolean => {
  if (!biography) return false;
  const bookKeywords = /ouvrage|livre|auteur|auteure|best-seller|best seller|publié|publie|écrit|écrivain|roman|essai/i;
  return bookKeywords.test(biography);
};

const generateFAQ = (speaker: any) => {
  const themes = parseThemes(speaker.themes);
  const themesText = themes.length > 0 ? themes.slice(0, 3).join(", ") : "le leadership et le management";
  const fem = isFemale(speaker);

  const faqs = [
    {
      question: `Quels sont les thèmes de conférence de ${speaker.name} ?`,
      answer: `${speaker.name} intervient principalement sur les thématiques suivantes : ${themesText}. Chaque conférence est adaptée au contexte et aux objectifs de votre événement.`,
    },
    {
      question: `Comment réserver ${speaker.name} pour un événement ?`,
      answer: `Pour réserver ${speaker.name}, contactez notre agence via le formulaire de contact ou par téléphone au 06 95 93 97 91. Nelly, votre interlocutrice dédiée, vous enverra un devis personnalisé sous 24 heures.`,
    },
    {
      question: `Une session de questions-réponses est-elle prévue à l'issue de la conférence ?`,
      answer: `Oui, la plupart de nos ${conferencier_e(speaker)}s proposent un temps d'échange avec le public après leur intervention. ${speaker.name} ${fem ? "est disponible" : "est disponible"} pour répondre aux questions de vos participants et approfondir les sujets abordés.`,
    },
    {
      question: `La durée d'intervention est-elle modulable ?`,
      answer: `Oui, la durée est ajustable selon vos besoins. En général, les interventions durent entre 35 minutes et 2 heures. ${speaker.name} s'adapte à votre programme et au format de votre événement.`,
    },
  ];

  // Conditionally add book signing FAQ
  if (hasPublishedBooks(speaker.biography)) {
    faqs.push({
      question: `Peut-on organiser une séance de dédicace ?`,
      answer: `${speaker.name} ${fem ? "est l'auteure" : "est l'auteur"} de plusieurs ouvrages. Il est tout à fait possible d'organiser une séance de dédicace à l'issue de la conférence. Contactez-nous pour organiser les détails logistiques.`,
    });
  }

  return faqs;
};

const generateWhyReasons = (speaker: any) => {
  const themes = parseThemes(speaker.themes);
  const themesText = themes.length > 0 ? themes.slice(0, 2).join(" et ") : "son domaine";
  const fem = isFemale(speaker);

  // Use personalized AI-generated text when available, fallback to generic
  const expertiseDesc = speaker.why_expertise 
    || `${speaker.name} est ${fem ? "une experte reconnue" : "un expert reconnu"} en ${themesText}, apportant une vision concrète et actionnable à chaque intervention.`;
  
  const impactDesc = speaker.why_impact 
    || `Les interventions de ${speaker.name} génèrent un réel retour sur investissement : motivation des équipes, nouvelles perspectives et dynamique positive durable.`;

  return [
    {
      icon: Target,
      title: "Expertise reconnue",
      description: expertiseDesc,
    },
    {
      icon: Lightbulb,
      title: "Intervention adaptée à votre secteur",
      description: `${speaker.name} adapte spécifiquement son intervention au secteur d'activité de votre entreprise pour maximiser la pertinence et l'impact auprès de vos équipes.`,
    },
    {
      icon: TrendingUp,
      title: "Impact mesurable",
      description: impactDesc,
    },
    {
      icon: Handshake,
      title: "Accompagnement professionnel",
      description: `Notre agence assure un suivi complet : de la préparation du brief à la coordination le jour J, pour un événement sans fausse note.`,
    },
  ];
};

// Remove speaker name from beginning of biography
const removeNameFromBio = (bio: string, name: string): string => {
  if (!bio || !name) return bio;
  // Try various patterns: "Prénom Nom est...", "Prénom Nom,", "Prénom Nom :"
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Also handle with just first name or reversed
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0];
  const patterns = [
    new RegExp(`^${escapedName}\\s*(,|est|a été|est un|est une|née?\\s)\\s*`, 'i'),
    new RegExp(`^${escapedName}\\s*[:,]?\\s*`, 'i'),
  ];
  
  let result = bio;
  for (const pattern of patterns) {
    if (pattern.test(result)) {
      result = result.replace(pattern, (match) => {
        // Keep the verb/connector part, just remove the name
        const withoutName = match.replace(new RegExp(`^${escapedName}\\s*,?\\s*`, 'i'), '');
        // Capitalize the first letter of remaining text
        return withoutName.charAt(0).toUpperCase() + withoutName.slice(1);
      });
      break;
    }
  }
  return result;
};

// Format biography for web readability: detect lists, add structure
const formatBioForWeb = (text: string): string => {
  // Split long paragraphs into shorter ones at sentence boundaries (aim for ~2-3 sentences per block)
  let result = text;

  // Detect enumeration patterns and convert to HTML lists
  // Pattern: "1) ... 2) ... 3) ..." or "1. ... 2. ..."
  result = result.replace(/(?:^|\n)\s*(\d+)[.)]\s+/g, '\n<li>');
  
  // Detect "- item" patterns
  result = result.replace(/(?:^|\n)\s*[-–—•]\s+(.+?)(?=(?:\n\s*[-–—•]|\n\n|$))/g, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  if (result.includes('<li>')) {
    result = result.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul class="my-4 ml-4 space-y-2">$1</ul>');
  }

  return result;
};

const highlightBioKeywords = (text: string): string => {
  // Bold patterns: years, numbers with units, quoted text, strong phrases, titles, key achievements
  const patterns = [
    /(\d{4})/g, // years
    /(\d+[\s]?(ans|pays|millions?|milliards?|livres?|ouvrages?|médailles?|records?|émissions?|entreprises?|collaborateurs?|salariés?|exemplaires?|langues?))/gi,
    /(champion(?:ne)?|record|prix|médaille|oscar|césar|palme|trophée|étoile|michelin|meilleur ouvrier|ballon d'or|victoire|best-seller|best seller)/gi,
    /(n°\s?\d+|numéro \d+|premier(?:e)?|première|pionnière?)/gi,
    /(fondateur|fondatrice|co-fondateur|co-fondatrice|directeur|directrice|président(?:e)?|professeur(?:e)?|expert(?:e)?|ambassadeur|ambassadrice)/gi,
    /(diplômé(?:e)?|agrégé(?:e)?|docteur(?:e)?)/gi,
    /(conférencier(?:e)?\s+inspirant(?:e)?|vision humaniste|référence sur le sujet)/gi,
    /«\s*([^»]+)\s*»/g, // Quoted titles → bold the whole thing
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
        .eq("archived", false)
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
      document.title = speaker.seo_title || `Conférence ${speaker.name} — ${conferencier_e(speaker)} | Les Conférenciers`;
      const desc = speaker.meta_description || `Réservez la conférence de ${speaker.name} pour votre événement. ${speaker.specialty || speaker.role || "Conférencier professionnel"}. Devis gratuit sous 24h.`;
      let metaEl = document.querySelector('meta[name="description"]');
      if (metaEl) {
        metaEl.setAttribute("content", desc);
      } else {
        metaEl = document.createElement("meta");
        metaEl.setAttribute("name", "description");
        metaEl.setAttribute("content", desc);
        document.head.appendChild(metaEl);
      }

      let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.href = window.location.origin + `/conferencier/${speaker.slug}`;

      const themes = parseThemes(speaker.themes);
      const pageUrl = window.location.origin + `/conferencier/${speaker.slug}`;
      const imageUrl = speaker.image_url || "";

      const personJsonLd = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          "@id": pageUrl + "#person",
          name: speaker.name,
          jobTitle: speaker.specialty || speaker.role,
          description: desc,
          image: imageUrl,
          url: pageUrl,
          knowsAbout: themes,
          knowsLanguage: speaker.languages || [],
          memberOf: {
            "@type": "Organization",
            name: "Les Conférenciers",
            url: window.location.origin,
          },
        },
      };

      const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: window.location.origin + "/" },
          { "@type": "ListItem", position: 2, name: "Conférenciers", item: window.location.origin + "/conferenciers" },
          { "@type": "ListItem", position: 3, name: `Conférence ${speaker.name}`, item: pageUrl },
        ],
      };

      const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: generateFAQ(speaker).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      };

      const conferencesListJsonLd = conferences && conferences.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Conférences de ${speaker.name}`,
        numberOfItems: conferences.length,
        itemListElement: conferences.map((conf, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Course",
            name: conf.title,
            description: conf.description || `Conférence « ${conf.title} » par ${speaker.name}`,
            provider: {
              "@type": "Organization",
              name: "Les Conférenciers",
              url: window.location.origin,
            },
          },
        })),
      } : null;

      const serviceJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `Conférence de ${speaker.name}`,
        description: `Réservez ${speaker.name} comme ${conferencier_e(speaker)} pour votre événement professionnel.`,
        provider: {
          "@type": "Organization",
          name: "Les Conférenciers",
          url: window.location.origin,
          telephone: "+33695939791",
        },
        areaServed: { "@type": "Country", name: "France" },
        serviceType: "Conférence professionnelle",
      };

      const schemas = [
        { key: "speaker", data: personJsonLd },
        { key: "breadcrumb", data: breadcrumbJsonLd },
        { key: "faq", data: faqJsonLd },
        { key: "conferences-list", data: conferencesListJsonLd },
        { key: "service", data: serviceJsonLd },
      ];

      schemas.forEach(({ key, data }) => {
        if (!data) return;
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
        document.querySelector('link[rel="canonical"]')?.remove();
      };
    }
  }, [speaker, conferences]);

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
            <Button onClick={() => navigate("/conferenciers")}>Retour à la liste</Button>
          </div>
        </div>
      </div>
    );
  }

  const themes = parseThemes(speaker.themes);
  const faqItems = generateFAQ(speaker);
  const whyReasons = generateWhyReasons(speaker);

  // Prepare biography: handle both HTML content and plain text
  const isHtmlBio = speaker.biography?.includes("<") ?? false;
  let processedBio = speaker.biography || "";
  
  if (isHtmlBio) {
    // HTML bio from rich text editor or AI formatting — already has <strong> etc.
    // Don't double-apply highlightBioKeywords if already rich HTML
    const hasExistingStrong = (processedBio.match(/<strong>/g) || []).length >= 2;
    if (!hasExistingStrong) {
      processedBio = highlightBioKeywords(processedBio);
    }
  } else {
    // Plain text bio — split into paragraphs
    const rawBioParagraphs = processedBio.split("\n").filter(Boolean);
    processedBio = rawBioParagraphs.map(p => `<p>${highlightBioKeywords(formatBioForWeb(p))}</p>`).join("");
  }

  // Language flag mapping
  const langFlags: Record<string, string> = {
    "Français": "🇫🇷",
    "Anglais": "🇬🇧",
    "Espagnol": "🇪🇸",
    "Allemand": "🇩🇪",
    "Italien": "🇮🇹",
    "Portugais": "🇵🇹",
    "Néerlandais": "🇳🇱",
    "Arabe": "🇸🇦",
    "Chinois": "🇨🇳",
    "Japonais": "🇯🇵",
  };

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
            <Link to="/conferenciers" className="hover:text-accent transition-colors">Conférenciers</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary-foreground font-medium">{speaker.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Medallion */}
            <div className="flex-shrink-0">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-accent/30 shadow-2xl bg-muted">
                {speaker.image_url ? (
                  <img
                    src={speaker.image_url}
                    alt={`${speaker.name} - conférencier professionnel`}
                    className="w-full h-full object-cover"
                    width={176} height={176}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2 leading-tight">
                {speaker.name}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/70 font-medium mb-5">
                {speaker.specialty || speaker.role}
              </p>

              {/* Themes */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                {themes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => navigate(`/conferenciers?theme=${encodeURIComponent(theme)}`)}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${getThemeColor(theme)}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>

              {/* Key Points */}
              {speaker.key_points && speaker.key_points.length > 0 && (
                <div className="flex flex-col gap-2 items-center md:items-start">
                  {speaker.key_points.slice(0, 4).map((point: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 text-sm text-primary-foreground/80">
                      <img src={nuggetIcon} alt="" className="h-4 w-4 flex-shrink-0 object-contain" />
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
              <div className="relative">
                <div 
                  className={`prose prose-lg max-w-none text-muted-foreground leading-relaxed overflow-hidden transition-all duration-500
                    [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-3
                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-3
                    [&_li]:mb-1.5 [&_li]:text-[0.95rem]
                    [&_p]:mb-3 [&_p]:text-[0.95rem] [&_p]:leading-[1.8]
                    [&_strong]:text-foreground [&_strong]:font-semibold
                    [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-4 [&_img]:max-w-[40%] [&_img]:float-right [&_img]:ml-6 [&_img]:mb-4
                    ${!bioExpanded ? "max-h-[180px]" : "max-h-[5000px]"}`}
                  dangerouslySetInnerHTML={{ __html: processedBio }}
                />
                {/* Gradient fade overlay when collapsed */}
                {!bioExpanded && processedBio.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                )}
              </div>
              {processedBio.length > 0 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-3 text-accent font-semibold text-sm hover:underline inline-flex items-center gap-1.5 transition-colors"
                >
                  {bioExpanded ? "Voir moins" : "Lire la suite de la biographie"}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${bioExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </section>

            {/* Conferences — collapsible accordion */}
            {conferences && conferences.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="w-1 h-7 bg-accent rounded-full block"></span>
                  Ses conférences
                </h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {conferences.map((conf) => (
                    <AccordionItem
                      key={conf.id}
                      value={conf.id}
                      className="border border-border/40 rounded-xl px-0 overflow-hidden data-[state=open]:border-accent/30 transition-colors"
                    >
                      <AccordionTrigger className="px-5 py-4 hover:no-underline gap-3">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Mic className="h-4 w-4 text-accent" />
                          </div>
                          <span className="font-serif font-bold text-foreground">{conf.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5 space-y-4">
                        {conf.description && (
                          <div 
                            className="text-muted-foreground text-sm leading-relaxed prose prose-sm max-w-none
                              [&_p]:mb-3 [&_p:last-child]:mb-0
                              [&_strong]:text-foreground [&_strong]:font-semibold
                              [&_ul]:my-3 [&_ul]:ml-1 [&_ul]:space-y-1.5
                              [&_ol]:my-3 [&_ol]:ml-1 [&_ol]:space-y-1.5
                              [&_li]:relative [&_li]:pl-5
                              [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.6em] [&_ul>li]:before:w-1.5 [&_ul>li]:before:h-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-accent/60
                              [&_ol]:list-decimal [&_ol]:pl-5
                              [&_em]:italic
                              [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4 [&_img]:w-full [&_img]:max-w-full"
                            dangerouslySetInnerHTML={{ __html: conf.description }}
                          />
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
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold rounded-xl gap-2"
                            onClick={() => navigate(`/contact?speaker=${encodeURIComponent(speaker.name)}&conference=${encodeURIComponent(conf.title)}`)}
                          >
                            <Mail className="h-4 w-4" /> Ça m'intéresse
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {/* Video */}
            {(speaker as any).video_url && (() => {
              const videoUrl = (speaker as any).video_url as string;
              // Handle both regular youtube URLs and embed URLs
              const videoId = videoUrl.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
              return videoId ? (
                <section>
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                    <span className="w-1 h-7 bg-accent rounded-full block"></span>
                    <Play className="h-5 w-5 text-accent" />
                    Vidéo de conférence
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-border/40 shadow-sm">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`Conférence de ${speaker.name}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                </section>
              ) : null;
            })()}

            {/* Why choose this speaker */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                <span className="w-1 h-7 bg-accent rounded-full block"></span>
                Pourquoi faire appel à {speaker.name} ?
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

            {/* Key Points */}
            {speaker.key_points && speaker.key_points.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                  <span className="w-1 h-7 bg-accent rounded-full block"></span>
                  {isFemale(speaker) ? "Ce qui la distingue" : "Ce qui le distingue"}
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
              <h3 className="font-serif font-bold text-lg mb-2">Intéressé par {ce_cette(speaker)} profil ?</h3>
              <p className="text-primary-foreground/70 text-sm mb-5">
                Contactez-nous pour vérifier la disponibilité de {speaker.name} pour votre événement.
              </p>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-2"
                onClick={() => navigate(`/contact?speaker=${encodeURIComponent(speaker.name)}`)}
              >
                <Mail className="h-4 w-4" /> Demander un devis
              </Button>
              <p className="text-center text-xs text-primary-foreground/50 mt-3">
                Devis gratuit sous 24h
              </p>
            </div>

            {/* Themes sidebar */}
            {themes.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="font-serif font-bold text-foreground mb-3">Thématiques</h3>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => navigate(`/conferenciers?theme=${encodeURIComponent(theme)}`)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${getThemeColor(theme)}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formats proposés */}
            <div className="bg-card border border-border/40 rounded-2xl p-6">
              <h3 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">
                <Mic className="h-4 w-4 text-accent" />
                Formats proposés
              </h3>
              <div className="space-y-2">
                {(["andre-comte-sponville", "catherine-destivelle"].includes(speaker.slug)
                  ? ["Conférence", "Table ronde"]
                  : ["Conférence", "Webconférence", "Table ronde"]
                ).map((format) => (
                  <div key={format} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span>{format}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Langues */}
            {speaker.languages && speaker.languages.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  {speaker.languages.length === 1 ? "Langue d'intervention" : "Langues d'intervention"}
                </h3>
                <div className="space-y-2">
                  {speaker.languages.map((lang: string) => (
                    <div key={lang} className="flex items-center gap-2.5 text-sm text-foreground">
                      <span className="text-base">{langFlags[lang] || "🌐"}</span>
                      <span className="font-medium">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Localisation removed from front - kept in CRM only */}

          </aside>
        </div>

        {/* Similar Speakers */}
        {similarSpeakers && similarSpeakers.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
              <span className="w-1 h-7 bg-accent rounded-full block"></span>
              Conférenciers similaires
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
