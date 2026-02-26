import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseThemes } from "@/lib/parseThemes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Users, Target, ArrowRight, RotateCcw,
  MapPin, Euro, Trophy, Search, CheckCircle2, MessageCircle,
  Lock, Mail, User
} from "lucide-react";

const EVENT_TYPES = [
  "Séminaire d'entreprise",
  "Convention annuelle",
  "Conférence de motivation",
  "Team building",
  "Soirée de gala",
  "Journée RSE / QVT",
  "Lancement de produit",
  "Formation / Workshop",
  "Autre",
];

const THEMES = [
  "Leadership", "Management", "Motivation", "Performance",
  "Cohésion d'équipe", "Innovation", "Gestion du stress", "Communication",
  "Bien-être au travail", "Négociation", "Dépassement de soi",
  "Conduite du changement", "Optimisme", "Entrepreneuriat",
  "Intelligence collective", "Transition écologique",
  "Autre",
];

const OBJECTIVES = [
  "Inspirer et motiver les équipes",
  "Renforcer la cohésion d'équipe",
  "Accompagner une transformation",
  "Sensibiliser sur un sujet clé",
  "Divertir et surprendre",
  "Former sur un domaine précis",
  "Autre",
];

const AUDIENCE_SIZES = [
  "Moins de 50 personnes",
  "50 à 150 personnes",
  "150 à 500 personnes",
  "Plus de 500 personnes",
];

const BUDGETS = [
  "Moins de 3 000 €",
  "3 000 € – 5 000 €",
  "5 000 € – 10 000 €",
  "10 000 € – 20 000 €",
  "Plus de 20 000 €",
  "À définir ensemble",
];

const SEARCH_MESSAGES = [
  "Analyse de vos critères en cours…",
  "Parcours de nos 161+ profils qualifiés…",
  "Évaluation de la compatibilité thématique…",
  "Vérification des disponibilités…",
  "Classement des meilleurs candidats…",
  "Finalisation de votre sélection personnalisée…",
];

const BLOCKED_DOMAINS = [
  "gmail.com", "yahoo.com", "yahoo.fr", "hotmail.com", "hotmail.fr",
  "outlook.com", "outlook.fr", "live.com", "live.fr", "aol.com",
  "icloud.com", "me.com", "mac.com", "mail.com", "protonmail.com",
  "proton.me", "gmx.com", "gmx.fr", "orange.fr", "free.fr",
  "sfr.fr", "laposte.net", "wanadoo.fr", "yandex.com",
];

const STEP_LABELS = ["Événement", "Audience", "Thématiques", "Objectif", "Budget & Lieu", "Détails"];
const TOTAL_STEPS = 6;

type SpeakerResult = {
  name: string;
  slug: string;
  role: string | null;
  image_url: string | null;
  themes: string[];
  matchReasons: string[];
};

const SpeakerSimulator = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<"form" | "searching" | "results" | "maxed">("form");

  // Form state
  const [eventType, setEventType] = useState("");
  const [customEventType, setCustomEventType] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [customTheme, setCustomTheme] = useState("");
  const [objective, setObjective] = useState("");
  const [customObjective, setCustomObjective] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Lead capture state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Results state
  const [results, setResults] = useState<SpeakerResult[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchMessageIndex, setSearchMessageIndex] = useState(0);
  const [searchCount, setSearchCount] = useState(0);

  const stepCompleted = useCallback((step: number) => {
    switch (step) {
      case 0: return !!eventType;
      case 1: return !!audienceSize;
      case 2: return selectedThemes.length > 0;
      case 3: return !!objective;
      case 4: return !!budget;
      case 5: return true;
      default: return false;
    }
  }, [eventType, audienceSize, selectedThemes, objective, budget]);

  const canProceed = stepCompleted(currentStep);

  const completionPercent = Math.round((currentStep / TOTAL_STEPS) * 100 + (canProceed ? (1 / TOTAL_STEPS) * 100 : 0));

  const gamificationMessage = () => {
    if (currentStep === 0 && eventType) return "Excellent choix — nous adaptons notre recherche à votre format.";
    if (currentStep === 1 && audienceSize) return "Bien noté. La taille de l'audience influence le choix du profil.";
    if (currentStep === 2 && selectedThemes.length === 3) return "Trois thématiques sélectionnées — combinaison optimale pour un matching précis.";
    if (currentStep === 2 && selectedThemes.length > 0) return "Vous pouvez sélectionner jusqu'à 3 thématiques pour affiner les résultats.";
    if (currentStep === 3 && objective) return "Objectif défini — notre algorithme va prioriser les profils les plus pertinents.";
    if (currentStep === 4 && budget) return "Parfait. Plus qu'une dernière étape avant votre sélection personnalisée.";
    if (currentStep === 5) return "Tout est prêt. Lancez la recherche pour découvrir vos profils recommandés.";
    return null;
  };

  const toggleTheme = (theme: string) => {
    if (theme === "Autre") return;
    setSelectedThemes((prev) =>
      prev.includes(theme)
        ? prev.filter((t) => t !== theme)
        : prev.length < 3 ? [...prev, theme] : prev
    );
  };

  const validateEmail = (value: string): string => {
    if (!value) return "L'email est requis.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Veuillez saisir un email valide.";
    const domain = value.split("@")[1]?.toLowerCase();
    if (BLOCKED_DOMAINS.includes(domain)) {
      return "Merci d'utiliser votre email professionnel (les adresses personnelles ne sont pas acceptées).";
    }
    return "";
  };

  const handleLeadSubmit = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setEmailError("Le prénom et le nom sont requis.");
      return;
    }
    setEmailError("");

    const effectiveThemes = [...selectedThemes, customTheme].filter(Boolean);
    const effectiveObjective = objective === "Autre" ? customObjective : objective;
    const effectiveEventType = eventType === "Autre" ? customEventType : eventType;

    await supabase.from("simulator_leads").insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      event_type: effectiveEventType || null,
      audience_size: audienceSize || null,
      themes: effectiveThemes.length > 0 ? effectiveThemes : null,
      objective: effectiveObjective || null,
      budget: budget || null,
      location: location || null,
      additional_info: additionalInfo || null,
      suggested_speakers: results.map((s) => s.name),
    });

    setLeadCaptured(true);
  };

  const handleSearch = async () => {
    setPhase("searching");
    setSearchProgress(0);
    setSearchMessageIndex(0);

    const { data: speakers } = await supabase
      .from("speakers")
      .select("name, slug, role, image_url, themes, key_points")
      .order("featured", { ascending: false });

    if (!speakers || speakers.length === 0) {
      setTimeout(() => setPhase("results"), 10000);
      return;
    }

    const scored = speakers.map((speaker) => {
      const speakerThemes = parseThemes(speaker.themes);
      const lowerSelected = selectedThemes.map((t) => t.toLowerCase());
      const matchingThemes = speakerThemes.filter((t) =>
        lowerSelected.some((s) => t.toLowerCase().includes(s) || s.includes(t.toLowerCase()))
      );

      const matchReasons: string[] = [];
      if (matchingThemes.length > 0) {
        matchReasons.push(`Expert en ${matchingThemes.slice(0, 2).join(" & ")}`);
      }
      if (speaker.role) {
        matchReasons.push(speaker.role.length > 60 ? speaker.role.substring(0, 57) + "…" : speaker.role);
      }
      if (speaker.key_points && speaker.key_points.length > 0) {
        matchReasons.push(speaker.key_points[0]);
      }

      return {
        name: speaker.name,
        slug: speaker.slug,
        role: speaker.role,
        image_url: speaker.image_url,
        themes: speakerThemes,
        matchReasons: matchReasons.slice(0, 3),
        score: matchingThemes.length * 10 + (speaker.role ? 1 : 0),
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).map(({ score, ...rest }) => rest);
    setResults(top3);
  };

  // Search animation timer
  useEffect(() => {
    if (phase !== "searching") return;

    const duration = 10000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setSearchProgress(progress);
      setSearchMessageIndex(Math.min(Math.floor((elapsed / duration) * SEARCH_MESSAGES.length), SEARCH_MESSAGES.length - 1));

      if (elapsed >= duration) {
        clearInterval(timer);
        setPhase("results");
        setSearchCount((prev) => prev + 1);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [phase]);

  const handleContactClick = (speaker: SpeakerResult) => {
    const effectiveThemes = [...selectedThemes, customTheme].filter(Boolean);
    const effectiveObjective = objective === "Autre" ? customObjective : objective;
    const effectiveEventType = eventType === "Autre" ? customEventType : eventType;
    const message = `Bonjour,\n\nJe suis intéressé(e) par le profil de ${speaker.name} pour ${effectiveEventType || "notre événement"}.\n\nType d'événement : ${effectiveEventType}\nNombre de personnes : ${audienceSize}\nThématiques souhaitées : ${effectiveThemes.join(", ")}\nObjectif : ${effectiveObjective}\nBudget : ${budget}\nLieu : ${location || "Non précisé"}\n${additionalInfo ? `Informations complémentaires : ${additionalInfo}` : ""}`;
    navigate(`/contact?speaker=${encodeURIComponent(speaker.name)}&message=${encodeURIComponent(message)}`);
  };

  const handleRetry = () => {
    if (searchCount >= 2) {
      setPhase("maxed");
    } else {
      setPhase("form");
      setCurrentStep(0);
      setResults([]);
      setEventType("");
      setCustomEventType("");
      setAudienceSize("");
      setSelectedThemes([]);
      setCustomTheme("");
      setObjective("");
      setCustomObjective("");
      setBudget("");
      setLocation("");
      setAdditionalInfo("");
      setLeadCaptured(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setEmailError("");
    }
  };

  const chipClass = (active: boolean) =>
    `px-4 py-2.5 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
      active
        ? "bg-accent text-accent-foreground border-accent shadow-md"
        : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:border-accent/40 hover:bg-primary-foreground/10"
    }`;

  return (
    <section className="py-24 px-4 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-sm font-medium tracking-wider uppercase mb-4">
            Outil interactif
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold">
            Trouvons le profil idéal{" "}
            <span className="text-accent italic">pour votre événement</span>
          </h2>
          <p className="text-primary-foreground/60 mt-4 max-w-2xl mx-auto text-lg">
            Répondez à quelques questions et nous vous suggérons les conférenciers les plus adaptés.
          </p>
        </div>

        {/* ===== CTA GATE ===== */}
        {!started && phase === "form" && (
          <div className="text-center">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl px-10 gap-2 text-base"
              onClick={() => setStarted(true)}
            >
              <Target className="h-5 w-5" />
              Démarrer votre profiling
            </Button>
            <p className="text-primary-foreground/30 text-xs mt-3">Gratuit • Sans engagement</p>
          </div>
        )}

        {/* ===== FORM PHASE ===== */}
        {started && phase === "form" && (
          <div className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-8 md:p-10 space-y-8">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-primary-foreground/50">
                <span>{STEP_LABELS[currentStep]}</span>
                <span>{completionPercent}% complété</span>
              </div>
              <Progress value={completionPercent} className="h-2 bg-primary-foreground/10 [&>div]:bg-accent" />
              <div className="flex justify-between">
                {STEP_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i <= currentStep ? "bg-accent" : "bg-primary-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Gamification message */}
            {gamificationMessage() && (
              <div className="text-center animate-fade-in">
                <span className="inline-block px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-sm text-accent font-medium">
                  {gamificationMessage()}
                </span>
              </div>
            )}

            {/* Step 0: Event type */}
            {currentStep === 0 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-primary-foreground mb-3">
                  <span className="inline-flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    Quel type d'événement organisez-vous ?
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EVENT_TYPES.map((type) => (
                    <button key={type} onClick={() => setEventType(type)} className={chipClass(eventType === type)}>
                      {type}
                    </button>
                  ))}
                </div>
                {eventType === "Autre" && (
                  <input
                    value={customEventType}
                    onChange={(e) => setCustomEventType(e.target.value)}
                    placeholder="Précisez le type d'événement…"
                    className="mt-3 w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                  />
                )}
              </div>
            )}

            {/* Step 1: Audience */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-primary-foreground mb-3">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent" />
                    Combien de participants attendez-vous ?
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AUDIENCE_SIZES.map((size) => (
                    <button key={size} onClick={() => setAudienceSize(size)} className={chipClass(audienceSize === size)}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Themes */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-primary-foreground mb-1">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Quelles thématiques vous intéressent ?
                  </span>
                </label>
                <p className="text-primary-foreground/40 text-xs mb-3">Sélectionnez jusqu'à 3 thématiques</p>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        if (theme === "Autre") return;
                        toggleTheme(theme);
                      }}
                      className={chipClass(theme === "Autre" ? !!customTheme : selectedThemes.includes(theme))}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
                <input
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Précisez une thématique personnalisée…"
                  className="mt-3 w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                />
              </div>
            )}

            {/* Step 3: Objective */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-primary-foreground mb-3">
                  <span className="inline-flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    Quel est l'objectif principal de l'intervention ?
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OBJECTIVES.map((obj) => (
                    <button key={obj} onClick={() => setObjective(obj)} className={`${chipClass(objective === obj)} text-left`}>
                      {obj}
                    </button>
                  ))}
                </div>
                {objective === "Autre" && (
                  <input
                    value={customObjective}
                    onChange={(e) => setCustomObjective(e.target.value)}
                    placeholder="Précisez votre objectif…"
                    className="mt-3 w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                  />
                )}
              </div>
            )}

            {/* Step 4: Budget & Location */}
            {currentStep === 4 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-primary-foreground mb-3">
                    <span className="inline-flex items-center gap-2">
                      <Euro className="h-4 w-4 text-accent" />
                      Quel est votre budget ?
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BUDGETS.map((b) => (
                      <button key={b} onClick={() => setBudget(b)} className={chipClass(budget === b)}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-foreground mb-3">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      Lieu de l'événement
                    </span>
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ville, région ou pays…"
                    className="w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 px-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Additional info */}
            {currentStep === 5 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-primary-foreground mb-3">
                  Informations complémentaires (optionnel)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Précisez votre secteur d'activité, le contexte de l'événement, vos attentes particulières…"
                  className="w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 px-4 py-3 text-sm focus:outline-none focus:border-accent/40 resize-none h-24"
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                className="text-primary-foreground/40 hover:text-primary-foreground hover:bg-primary-foreground/5"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                ← Précédent
              </Button>

              {currentStep < TOTAL_STEPS - 1 ? (
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl px-8 gap-2"
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={!canProceed}
                >
                  Continuer <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl px-10 gap-2"
                  onClick={handleSearch}
                  disabled={!eventType || selectedThemes.length === 0}
                >
                  <Search className="h-5 w-5" />
                  Trouver mon conférencier idéal
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ===== SEARCHING PHASE ===== */}
        {phase === "searching" && (
          <div className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-10 md:p-14">
            <div className="text-center space-y-6 max-w-lg mx-auto">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"
                  style={{ animationDuration: "1.5s" }}
                />
                <Search className="absolute inset-0 m-auto h-8 w-8 text-accent" />
              </div>

              <div className="space-y-2">
                <p className="text-primary-foreground text-lg font-semibold animate-fade-in" key={searchMessageIndex}>
                  {SEARCH_MESSAGES[searchMessageIndex]}
                </p>
                <p className="text-primary-foreground/40 text-sm">
                  Notre algorithme analyse chaque profil pour vous.
                </p>
              </div>

              <div className="space-y-2">
                <Progress value={searchProgress} className="h-3 bg-primary-foreground/10 [&>div]:bg-gradient-to-r [&>div]:from-accent/70 [&>div]:to-accent" />
                <p className="text-primary-foreground/30 text-xs">{Math.round(searchProgress)}%</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {["🎯 Pertinence", "⭐ Expérience", "💡 Originalité"].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== RESULTS PHASE ===== */}
        {phase === "results" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full mb-4">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="text-accent text-sm font-medium">Recherche terminée</span>
              </div>
              <p className="text-primary-foreground/60 text-lg">
                Voici les <strong className="text-accent">3 profils</strong> les plus adaptés à votre événement.
              </p>
            </div>

            {/* Blurred results preview */}
            <div className="relative">
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${!leadCaptured ? "blur-md pointer-events-none select-none" : ""}`}>
                {results.map((speaker, idx) => (
                  <div
                    key={speaker.slug}
                    className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl overflow-hidden hover:border-accent/40 transition-all group"
                    style={{ animationDelay: `${idx * 200}ms` }}
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {speaker.image_url && (
                          <img
                            src={speaker.image_url}
                            alt={speaker.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-accent/30"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-serif font-bold text-primary-foreground leading-tight">
                            {speaker.name}
                          </h3>
                          {speaker.role && (
                            <p className="text-primary-foreground/50 text-xs line-clamp-1">{speaker.role}</p>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-1.5">
                        {speaker.matchReasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-primary-foreground/70">
                            <svg className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-1 text-sm"
                          onClick={() => handleContactClick(speaker)}
                        >
                          Ça m'intéresse <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-accent hover:text-accent hover:bg-accent/10 rounded-xl text-sm font-medium"
                          onClick={() => navigate(`/speakers/${speaker.slug}`)}
                        >
                          Voir le profil
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lead capture overlay */}
              {!leadCaptured && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary border border-primary-foreground/15 rounded-2xl p-8 md:p-10 max-w-md w-full mx-4 shadow-2xl space-y-6">
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-accent" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-primary-foreground">
                        Votre sélection est prête
                      </h3>
                      <p className="text-primary-foreground/50 text-sm">
                        Recevez vos 3 profils recommandés directement par email pour les consulter à tout moment.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                          <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Prénom"
                            className="w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                          />
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                          <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Nom"
                            className="w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError("");
                          }}
                          placeholder="Email professionnel"
                          className="w-full rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/30 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent/40"
                        />
                      </div>
                      {emailError && (
                        <p className="text-red-400 text-xs px-1">{emailError}</p>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-2"
                      onClick={handleLeadSubmit}
                    >
                      <Mail className="h-4 w-4" />
                      Recevoir ma sélection
                    </Button>
                    <p className="text-primary-foreground/25 text-[11px] text-center">
                      Vos données sont confidentielles et ne seront jamais partagées.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {leadCaptured && (
              <div className="text-center pt-4">
                {searchCount < 2 ? (
                  <Button
                    variant="ghost"
                    className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/5 gap-2"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Relancer la recherche ({2 - searchCount} essai{2 - searchCount > 1 ? "s" : ""} restant{2 - searchCount > 1 ? "s" : ""})
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-primary-foreground/50 text-sm">
                      Vous avez utilisé vos 2 recherches. Contactez-nous pour affiner humainement votre sélection !
                    </p>
                    <Button
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl px-8 gap-2"
                      onClick={() => navigate("/contact")}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Nous contacter directement
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== MAXED OUT PHASE ===== */}
        {phase === "maxed" && (
          <div className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-10 text-center space-y-6">
            <MessageCircle className="h-14 w-14 text-accent mx-auto" />
            <h3 className="text-2xl font-serif font-bold text-primary-foreground">
              Besoin d'un accompagnement personnalisé ?
            </h3>
            <p className="text-primary-foreground/60 max-w-lg mx-auto">
              Nelly, forte de ses 20 ans d'expérience, peut affiner votre recherche et vous proposer
              l'intervenant idéal en quelques heures.
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl px-10 gap-2"
              onClick={() => navigate("/contact")}
            >
              <ArrowRight className="h-5 w-5" />
              Contactez-nous
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpeakerSimulator;
