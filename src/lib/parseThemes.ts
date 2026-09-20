/**
 * Master list of canonical themes (28). AI imports MUST only use themes from this list.
 */
export const CANONICAL_THEMES: string[] = [
  "Adaptabilité",
  "Audace",
  "Bien-être au travail",
  "Cohésion d'équipe",
  "Communication",
  "Conduite du changement",
  "Confiance",
  "Dépassement de soi/Motivation",
  "Diversité et handicap",
  "Économie",
  "Engagement",
  "Entrepreneuriat",
  "Environnement",
  "Expérience client",
  "Gestion de crise",
  "Gestion des risques",
  "Innovation",
  "Intelligence artificielle",
  "Intelligence émotionnelle",
  "Jeunes générations",
  "Leadership",
  "Management",
  "Négociation",
  "Optimisme",
  "Performance",
  "Prise de décision",
  "Résilience",
  "Transformation",
];

/**
 * Themes that were removed and must be dropped (no parent category).
 */
const REMOVED_THEMES = new Set<string>([
  "empowerment",
  "expérience collaborateur",
  "experience collaborateur",
  "neurosciences",
  "storytelling",
]);

/**
 * Canonical theme mappings: every legacy theme (and its casing/accent variants)
 * points to its parent category.
 * Key = lowercased version, Value = canonical display form.
 */
const THEME_ALIASES: Record<string, string> = {
  // Adaptabilité
  "adaptabilité": "Adaptabilité",
  "adaptabilite": "Adaptabilité",

  // Audace
  "audace": "Audace",

  // Bien-être au travail (= Bienveillance)
  "bien etre": "Bien-être au travail",
  "bien-etre": "Bien-être au travail",
  "bien être": "Bien-être au travail",
  "bien-être": "Bien-être au travail",
  "bien-être au travail": "Bien-être au travail",
  "bien etre au travail": "Bien-être au travail",
  "bonheur": "Bien-être au travail",
  "qualité de vie au travail": "Bien-être au travail",
  "bienveillance": "Bien-être au travail",

  // Cohésion d'équipe (= Collectif, Esprit d'équipe, Performance collective, Intelligence collective)
  "cohesion de groupe": "Cohésion d'équipe",
  "cohésion de groupe": "Cohésion d'équipe",
  "cohesion d'equipe": "Cohésion d'équipe",
  "cohésion d'equipe": "Cohésion d'équipe",
  "cohésion d'équipe": "Cohésion d'équipe",
  "cohesion d'équipe": "Cohésion d'équipe",
  "cohesion": "Cohésion d'équipe",
  "cohésion": "Cohésion d'équipe",
  "collectif": "Cohésion d'équipe",
  "esprit d'equipe": "Cohésion d'équipe",
  "esprit d'équipe": "Cohésion d'équipe",
  "performance collective": "Cohésion d'équipe",
  "intelligence collective": "Cohésion d'équipe",

  // Communication (= Prise de parole, Marketing)
  "communication": "Communication",
  "eloquence": "Communication",
  "éloquence": "Communication",
  "prise de parole": "Communication",
  "prise de parole en public": "Communication",
  "marketing": "Communication",

  // Conduite du changement
  "conduite du changement": "Conduite du changement",
  "adaptation au changement": "Conduite du changement",
  "adaptabilité/conduite du changement": "Conduite du changement",

  // Confiance (= Confiance en soi)
  "confiance": "Confiance",
  "confiance en soi": "Confiance",

  // Dépassement de soi/Motivation
  "dépassement de soi": "Dépassement de soi/Motivation",
  "depassement de soi": "Dépassement de soi/Motivation",
  "motivation": "Dépassement de soi/Motivation",
  "dépassement de soi/motivation": "Dépassement de soi/Motivation",

  // Diversité et handicap (= Handicap, Parité)
  "diversité": "Diversité et handicap",
  "la diversité": "Diversité et handicap",
  "diversité et handicap": "Diversité et handicap",
  "diversité & inclusion": "Diversité et handicap",
  "diversité et inclusion": "Diversité et handicap",
  "handicap": "Diversité et handicap",
  "parité": "Diversité et handicap",
  "parité homme-femme": "Diversité et handicap",
  "egalité homme femme": "Diversité et handicap",
  "égalité homme femme": "Diversité et handicap",
  "égalité & parité": "Diversité et handicap",
  "lutte contre le sexisme": "Diversité et handicap",

  // Économie (= Géopolitique)
  "economie": "Économie",
  "économie": "Économie",
  "géopolitique": "Économie",
  "geopolitique": "Économie",

  // Engagement
  "engagement": "Engagement",

  // Entrepreneuriat
  "entreprenariat": "Entrepreneuriat",
  "entreprenauriat": "Entrepreneuriat",
  "entrepreunariat": "Entrepreneuriat",
  "entrepreneuriat": "Entrepreneuriat",

  // Environnement
  "ecologie": "Environnement",
  "écologie": "Environnement",
  "environnement": "Environnement",
  "écologie & environnement": "Environnement",
  "développement durable et environnement": "Environnement",
  "developpement durable et environnement": "Environnement",
  "développement durable": "Environnement",
  "rse": "Environnement",
  "urbanisme": "Environnement",
  "aménagement du territoire": "Environnement",
  "changement climatique": "Environnement",
  "transition écologique": "Environnement",
  "sobriété énergétique": "Environnement",

  // Expérience client
  "expérience client": "Expérience client",
  "expérience clients": "Expérience client",
  "expérience-client": "Expérience client",
  "culture client": "Expérience client",

  // Gestion de crise (= Gestion des conflits, Gestion du stress)
  "gestion de crise": "Gestion de crise",
  "gestion de crises": "Gestion de crise",
  "gestion de crise / stress": "Gestion de crise",
  "gestion du stress": "Gestion de crise",
  "gestion de stress": "Gestion de crise",
  "gestion du temps": "Gestion de crise",
  "gestion des conflit": "Gestion de crise",
  "gestion des conflits": "Gestion de crise",

  // Gestion des risques (= Maîtrise des risques, Cybersécurité)
  "gestion des risques": "Gestion des risques",
  "maîtrise des risques": "Gestion des risques",
  "maitrise des risques": "Gestion des risques",
  "cybersécurité": "Gestion des risques",
  "cybersecurite": "Gestion des risques",

  // Innovation (= Créativité)
  "innovation": "Innovation",
  "créativité": "Innovation",
  "creativite": "Innovation",
  "apprentissage": "Innovation",

  // Intelligence artificielle
  "intelligence artificielle": "Intelligence artificielle",

  // Intelligence émotionnelle (= Gestion des émotions, Intelligence relationnelle, Facteur humain)
  "intelligence emotionnelle": "Intelligence émotionnelle",
  "intelligence émotionnelle": "Intelligence émotionnelle",
  "gestion des emotions": "Intelligence émotionnelle",
  "gestion des émotions": "Intelligence émotionnelle",
  "intelligence relationnelle": "Intelligence émotionnelle",
  "facteur humain": "Intelligence émotionnelle",

  // Jeunes générations
  "jeunes générations": "Jeunes générations",
  "jeunes generations": "Jeunes générations",

  // Leadership / Management
  "leadership": "Leadership",
  "management": "Management",
  "manager": "Management",

  // Négociation
  "négociation": "Négociation",
  "négociation/vente": "Négociation",
  "vente": "Négociation",

  // Optimisme
  "optimisme": "Optimisme",

  // Performance
  "performance": "Performance",

  // Prise de décision (= Biais cognitifs, Désinformation, Esprit critique)
  "prise de décision": "Prise de décision",
  "prise de decision": "Prise de décision",
  "biais cognitifs": "Prise de décision",
  "désinformation": "Prise de décision",
  "desinformation": "Prise de décision",
  "esprit critique": "Prise de décision",
  "désinformation esprit critique": "Prise de décision",

  // Résilience (= Gestion de l'échec, Droit à l'erreur)
  "résilience": "Résilience",
  "resilience": "Résilience",
  "résilience & gestion du stress": "Résilience",
  "rebond": "Résilience",
  "rebondir après un échec": "Résilience",
  "echec": "Résilience",
  "échec": "Résilience",
  "succès et échecs": "Résilience",
  "gestion de l'échec": "Résilience",
  "gestion de l'echec": "Résilience",
  "droit à l'erreur": "Résilience",
  "droit a l'erreur": "Résilience",

  // Transformation (= Transformation digitale, Stratégie)
  "transformation": "Transformation",
  "transformation digitale": "Transformation",
  "digitalisation": "Transformation",
  "stratégie digitale": "Transformation",
  "strategie digitale": "Transformation",
  "strategie": "Transformation",
  "stratégie": "Transformation",
};

/** Normalize a single theme string to its canonical form ("" if removed/unknown-cased) */
const normalizeTheme = (theme: string): string => {
  const trimmed = theme.trim();
  if (!trimmed) return "";
  // Replace curly apostrophes with straight ones
  const normalized = trimmed.replace(/\u2019/g, "'");
  const lower = normalized.toLowerCase();
  if (REMOVED_THEMES.has(lower)) return "";
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

/**
 * Filter themes to only keep canonical ones. Used for AI imports.
 * Themes not in the canonical list are dropped.
 */
export const filterToCanonicalThemes = (themes: string[]): string[] => {
  const normalized = themes.map(t => normalizeTheme(t)).filter(Boolean);
  return [...new Set(normalized.filter(t => CANONICAL_THEMES.includes(t)))];
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
