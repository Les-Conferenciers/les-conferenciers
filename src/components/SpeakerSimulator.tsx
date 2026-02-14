import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { parseThemes } from "@/lib/parseThemes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Users, Target, ArrowRight, Loader2, RotateCcw } from "lucide-react";

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
  "Leadership",
  "Management",
  "Motivation",
  "Performance",
  "Cohésion d'équipe",
  "Innovation",
  "Gestion du stress",
  "Communication",
  "Bien-être au travail",
  "Négociation",
  "Dépassement de soi",
  "Conduite du changement",
  "Optimisme",
  "Entrepreneuriat",
  "Intelligence collective",
  "Transition écologique",
];

const OBJECTIVES = [
  "Inspirer et motiver les équipes",
  "Renforcer la cohésion d'équipe",
  "Accompagner une transformation",
  "Sensibiliser sur un sujet clé",
  "Divertir et surprendre",
  "Former sur un domaine précis",
];

const AUDIENCE_SIZES = [
  "Moins de 50 personnes",
  "50 à 150 personnes",
  "150 à 500 personnes",
  "Plus de 500 personnes",
];

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
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [eventType, setEventType] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [objective, setObjective] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [results, setResults] = useState<SpeakerResult[]>([]);

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : prev.length < 3 ? [...prev, theme] : prev
    );
  };

  const handleSubmit = async () => {
    setStep("loading");

    // Fetch speakers that match the selected themes
    const { data: speakers } = await supabase
      .from("speakers")
      .select("name, slug, role, image_url, themes, key_points")
      .order("featured", { ascending: false });

    if (!speakers || speakers.length === 0) {
      setStep("results");
      return;
    }

    // Score speakers based on theme overlap
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

    // Sort by score and take top 3
    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).map(({ score, ...rest }) => rest);

    setResults(top3);

    // Simulate a small delay for UX
    setTimeout(() => setStep("results"), 800);
  };

  const handleContactClick = (speaker: SpeakerResult) => {
    const message = `Bonjour,\n\nJe suis intéressé(e) par le profil de ${speaker.name} pour ${eventType || "notre événement"}.\n\nType d'événement : ${eventType}\nNombre de personnes : ${audienceSize}\nThématiques souhaitées : ${selectedThemes.join(", ")}\nObjectif : ${objective}\n${additionalInfo ? `Informations complémentaires : ${additionalInfo}` : ""}`;
    navigate(`/contact?speaker=${encodeURIComponent(speaker.name)}&message=${encodeURIComponent(message)}`);
  };

  const handleReset = () => {
    setStep("form");
    setResults([]);
    setEventType("");
    setAudienceSize("");
    setSelectedThemes([]);
    setObjective("");
    setAdditionalInfo("");
  };

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
            Répondez à quelques questions et nous vous suggérons les conférenciers les plus adaptés à vos besoins.
          </p>
        </div>

        {step === "form" && (
          <div className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-8 md:p-10 space-y-8">
            {/* Event type */}
            <div>
              <label className="block text-sm font-semibold text-primary-foreground mb-3">
                <span className="inline-flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Type d'événement
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setEventType(type)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      eventType === type
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:border-accent/40"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience size */}
            <div>
              <label className="block text-sm font-semibold text-primary-foreground mb-3">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Nombre de participants
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AUDIENCE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setAudienceSize(size)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      audienceSize === size
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:border-accent/40"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div>
              <label className="block text-sm font-semibold text-primary-foreground mb-1">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Thématiques souhaitées
                </span>
              </label>
              <p className="text-primary-foreground/40 text-xs mb-3">Sélectionnez jusqu'à 3 thématiques</p>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => toggleTheme(theme)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selectedThemes.includes(theme)
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-primary-foreground/5 text-primary-foreground/60 border-primary-foreground/10 hover:border-accent/40"
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Objective */}
            <div>
              <label className="block text-sm font-semibold text-primary-foreground mb-3">
                Objectif principal de l'intervention
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj}
                    onClick={() => setObjective(obj)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border text-left ${
                      objective === obj
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-primary-foreground/5 text-primary-foreground/70 border-primary-foreground/10 hover:border-accent/40"
                    }`}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional info */}
            <div>
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

            <div className="text-center pt-2">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl px-10 gap-2"
                onClick={handleSubmit}
                disabled={!eventType || selectedThemes.length === 0}
              >
                <Sparkles className="h-5 w-5" />
                Trouver mon conférencier idéal
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-6" />
            <p className="text-primary-foreground/70 text-lg font-medium">
              Analyse de votre besoin en cours…
            </p>
            <p className="text-primary-foreground/40 text-sm mt-2">
              Nous parcourons nos 161+ profils pour vous trouver les meilleurs candidats.
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-primary-foreground/60 text-lg">
                Voici les <strong className="text-accent">3 profils</strong> qui correspondent le mieux à votre événement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((speaker, idx) => (
                <div
                  key={speaker.slug}
                  className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl overflow-hidden hover:border-accent/40 transition-all group"
                >
                  {speaker.image_url && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-primary-foreground">
                        {speaker.name}
                      </h3>
                    </div>
                    {speaker.role && (
                      <p className="text-primary-foreground/50 text-sm line-clamp-2">{speaker.role}</p>
                    )}
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
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-xl gap-1 text-sm"
                        onClick={() => handleContactClick(speaker)}
                      >
                        Ça m'intéresse
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl text-sm"
                        onClick={() => navigate(`/speakers/${speaker.slug}`)}
                      >
                        Voir le profil
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <Button
                variant="ghost"
                className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/5 gap-2"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
                Relancer la recherche
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SpeakerSimulator;
