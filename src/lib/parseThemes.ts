/**
 * Master list of canonical themes. AI imports MUST only use themes from this list.
 * Manual creation in admin is still allowed.
 */
export const CANONICAL_THEMES: string[] = [
  "Adaptabilité",
  "Audace",
  "Bien-être au travail",
  "Bienveillance",
  "Cohésion d'équipe",
  "Collectif",
  "Communication",
  "Conduite du changement",
  "Confiance",
  "Confiance en soi",
  "Créativité",
  "Cybersécurité",
  "Dépassement de soi",
  "Diversité et handicap",
  "Droit à l'erreur",
  "Économie",
  "Empowerment",
  "Engagement",
  "Entrepreneuriat",
  "Environnement",
  "Esprit d'équipe",
  "Expérience client",
  "Expérience collaborateur",
  "Facteur humain",
  "Géopolitique",
  "Gestion de crise",
  "Gestion de l'échec",
  "Gestion des conflits",
  "Gestion des émotions",
  "Gestion des risques",
  "Gestion du stress",
  "Handicap",
  "Innovation",
  "Intelligence artificielle",
  "Intelligence collective",
  "Intelligence émotionnelle",
  "Intelligence relationnelle",
  "Jeunes générations",
  "Leadership",
  "Maîtrise des risques",
  "Management",
  "Marketing",
  "Motivation",
  "Négociation",
  "Neurosciences",
  "Optimisme",
  "Parité",
  "Performance",
  "Performance collective",
  "Prise de décision",
  "Prise de parole",
  "Résilience",
  "Storytelling",
  "Stratégie",
  "Transformation",
  "Transformation digitale",
];

/**
 * Canonical theme mappings: normalize duplicates caused by casing, hyphens,
 * accents, plural forms, etc.
 * Key = lowercased version, Value = canonical display form.
 */
const THEME_ALIASES: Record<string, string> = {
  // Bien-être
  "bien etre": "Bien-être au travail",
  "bien-etre": "Bien-être au travail",
  "bien être": "Bien-être au travail",
  "bien-être": "Bien-être au travail",
  "bien-être au travail": "Bien-être au travail",
  "bien etre au travail": "Bien-être au travail",

  // Cohésion
  "cohesion de groupe": "Cohésion d'équipe",
  "cohésion de groupe": "Cohésion d'équipe",
  "cohesion d'equipe": "Cohésion d'équipe",
  "cohésion d'equipe": "Cohésion d'équipe",
  "cohésion d'équipe": "Cohésion d'équipe",
  "cohesion d'équipe": "Cohésion d'équipe",
  "cohesion": "Cohésion d'équipe",
  "cohésion": "Cohésion d'équipe",

  // Intelligence
  "intelligence artificielle": "Intelligence artificielle",
  "intelligence collective": "Intelligence collective",
  "intelligence emotionnelle": "Intelligence émotionnelle",
  "intelligence émotionnelle": "Intelligence émotionnelle",
  "intelligence relationnelle": "Intelligence relationnelle",

  // Gestion
  "gestion de crise": "Gestion de crise",
  "gestion de crises": "Gestion de crise",
  "gestion de crise / stress": "Gestion de crise",
  "gestion du stress": "Gestion du stress",
  "gestion de stress": "Gestion du stress",
  "gestion des emotions": "Gestion des émotions",
  "gestion des émotions": "Gestion des émotions",
  "gestion de l'échec": "Gestion de l'échec",
  "gestion de l'echec": "Gestion de l'échec",
  "gestion des conflit": "Gestion des conflits",
  "gestion des conflits": "Gestion des conflits",
  "gestion des risques": "Gestion des risques",
  "gestion du temps": "Gestion du stress",

  // Conduite du changement
  "conduite du changement": "Conduite du changement",
  "adaptation au changement": "Conduite du changement",
  "adaptabilité/conduite du changement": "Conduite du changement",
  "adaptabilité": "Adaptabilité",

  // Esprit d'équipe
  "esprit d'equipe": "Esprit d'équipe",
  "esprit d'équipe": "Esprit d'équipe",

  // Entrepreneuriat
  "entreprenariat": "Entrepreneuriat",
  "entreprenauriat": "Entrepreneuriat",
  "entrepreunariat": "Entrepreneuriat",
  "entrepreneuriat": "Entrepreneuriat",

  // Environnement (regroupe RSE, Écologie, Urbanisme, Aménagement)
  "ecologie": "Environnement",
  "écologie": "Environnement",
  "environnement": "Environnement",
  "écologie & environnement": "Environnement",
  "rse": "Environnement",
  "urbanisme": "Environnement",
  "aménagement du territoire": "Environnement",

  // Économie
  "economie": "Économie",
  "économie": "Économie",

  // Éloquence / Prise de parole
  "eloquence": "Prise de parole",
  "éloquence": "Prise de parole",
  "prise de parole": "Prise de parole",
  "prise de parole en public": "Prise de parole",

  // Expérience client
  "expérience client": "Expérience client",
  "expérience clients": "Expérience client",
  "expérience-client": "Expérience client",
  "culture client": "Expérience client",

  // Transformation digitale
  "transformation digitale": "Transformation digitale",
  "digitalisation": "Transformation digitale",
  "stratégie digitale": "Transformation digitale",
  "strategie digitale": "Transformation digitale",

  // Diversité
  "diversité": "Diversité et handicap",
  "la diversité": "Diversité et handicap",
  "diversité et handicap": "Diversité et handicap",
  "diversité & inclusion": "Diversité et handicap",
  "diversité et inclusion": "Diversité et handicap",

  // Parité
  "egalité homme femme": "Parité",
  "égalité homme femme": "Parité",
  "parité homme-femme": "Parité",
  "lutte contre le sexisme": "Parité",
  "égalité & parité": "Parité",
  "parité": "Parité",

  // Résilience
  "résilience": "Résilience",
  "résilience & gestion du stress": "Résilience",
  "rebond": "Résilience",
  "rebondir après un échec": "Résilience",

  // Échec → Gestion de l'échec
  "echec": "Gestion de l'échec",
  "échec": "Gestion de l'échec",
  "succès et échecs": "Gestion de l'échec",

  // Stratégie
  "strategie": "Stratégie",
  "stratégie": "Stratégie",

  // Dépassement de soi
  "dépassement de soi": "Dépassement de soi",

  // Performance
  "performance": "Performance",
  "performance collective": "Performance collective",

  // Négociation
  "négociation": "Négociation",
  "négociation/vente": "Négociation",
  "vente": "Négociation",

  // Jeunes générations
  "jeunes générations": "Jeunes générations",
  "jeunes generations": "Jeunes générations",

  // Innovation
  "innovation": "Innovation",

  // Leadership & Management
  "leadership": "Leadership",
  "management": "Management",
  "manager": "Management",

  // Others kept consistent
  "bienveillance": "Bienveillance",
  "bonheur": "Bien-être au travail",
  "changement climatique": "Environnement",
  "transition écologique": "Environnement",
  "sobriété énergétique": "Environnement",
  "confiance": "Confiance",
  "confiance en soi": "Confiance en soi",
  "créativité": "Créativité",
  "engagement": "Engagement",
  "handicap": "Handicap",
  "marketing": "Marketing",
  "motivation": "Motivation",
  "neurosciences": "Neurosciences",
  "optimisme": "Optimisme",
  "qualité de vie au travail": "Bien-être au travail",
  "storytelling": "Storytelling",
  "transformation": "Transformation",
  
  "communication": "Communication",
  "audace": "Audace",
  "collectif": "Collectif",
  "empowerment": "Empowerment",
  "facteur humain": "Facteur humain",
  "maîtrise des risques": "Maîtrise des risques",
  "droit à l'erreur": "Droit à l'erreur",
  "expérience collaborateur": "Expérience collaborateur",
  "apprentissage": "Innovation",
  "cybersécurité": "Cybersécurité",
  "géopolitique": "Géopolitique",
  "prise de décision": "Prise de décision",
};

/** Normalize a single theme string to its canonical form */
const normalizeTheme = (theme: string): string => {
  const trimmed = theme.trim();
  if (!trimmed) return "";
  // Replace curly apostrophes with straight ones
  const normalized = trimmed.replace(/\u2019/g, "'");
  const lower = normalized.toLowerCase();
  if (THEME_ALIASES[lower]) return THEME_ALIASES[lower];
  // Default: capitalize first letter of the string, keep rest as-is
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

/**
 * Parse raw theme strings from the database.
 * Themes are stored as arrays with entries like:
 * "Thématiques :\nEntreprenariat | Performance | Motivation"
 * or "Leadership I Conduite du changement" (I as separator)
 * or just "Thématiques"
 */
export const parseThemes = (themes: string[] | null): string[] => {
  if (!themes || themes.length === 0) return [];

  const parsed: string[] = [];
  for (const raw of themes) {
    const cleaned = raw.replace(/^Thématiques\s*:?\s*/i, "").trim();
    if (!cleaned) continue;
    // Split on "|" or " I " (capital I used as separator between themes)
    const parts = cleaned
      .split(/\s*\|\s*|\s+I\s+/)
      .map((t) => normalizeTheme(t))
      .filter(Boolean);
    parsed.push(...parts);
  }
  return [...new Set(parsed)]; // deduplicate after normalization
};

// Deterministic color palette for theme badges
const THEME_COLORS = [
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-pink-100 text-pink-800 border-pink-200",
];

export const getThemeColor = (theme: string): string => {
  let hash = 0;
  for (let i = 0; i < theme.length; i++) {
    hash = theme.charCodeAt(i) + ((hash << 5) - hash);
  }
  return THEME_COLORS[Math.abs(hash) % THEME_COLORS.length];
};
