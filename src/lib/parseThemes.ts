/**
 * Canonical theme mappings: normalize duplicates caused by casing, hyphens, etc.
 * Key = lowercased version, Value = canonical display form.
 */
const THEME_ALIASES: Record<string, string> = {
  "bien etre": "Bien-être",
  "bien-etre": "Bien-être",
  "bien être": "Bien-être",
  "bien-être": "Bien-être",
  "bien-être au travail": "Bien-être au travail",
  "bien etre au travail": "Bien-être au travail",
  "cohesion de groupe": "Cohésion de groupe",
  "cohésion de groupe": "Cohésion de groupe",
  "cohesion d'equipe": "Cohésion d'équipe",
  "cohésion d'equipe": "Cohésion d'équipe",
  "cohésion d'équipe": "Cohésion d'équipe",
  "cohesion d'équipe": "Cohésion d'équipe",
  "cohesion": "Cohésion",
  "cohésion": "Cohésion",
  "bienveillance": "Bienveillance",
  "bonheur": "Bonheur",
  "changement climatique": "Changement climatique",
};

/** Normalize a single theme string to its canonical form */
const normalizeTheme = (theme: string): string => {
  const lower = theme.toLowerCase().trim();
  if (THEME_ALIASES[lower]) return THEME_ALIASES[lower];
  // Default: capitalize first letter, lowercase rest
  return theme.charAt(0).toUpperCase() + theme.slice(1);
};

/**
 * Parse raw theme strings from the database.
 * Themes are stored as arrays with entries like:
 * "Thématiques :\nEntreprenariat | Performance | Motivation"
 * or just "Thématiques"
 */
export const parseThemes = (themes: string[] | null): string[] => {
  if (!themes || themes.length === 0) return [];

  const parsed: string[] = [];
  for (const raw of themes) {
    const cleaned = raw.replace(/^Thématiques\s*:?\s*/i, "").trim();
    if (!cleaned) continue;
    const parts = cleaned.split("|").map((t) => normalizeTheme(t)).filter(Boolean);
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
