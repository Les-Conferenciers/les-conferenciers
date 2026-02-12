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
    // Remove "Thématiques" prefix (with optional ":" and whitespace/newlines)
    const cleaned = raw.replace(/^Thématiques\s*:?\s*/i, "").trim();
    if (!cleaned) continue;
    // Split by " | " separator
    const parts = cleaned.split("|").map((t) => t.trim()).filter(Boolean);
    parsed.push(...parts);
  }
  return [...new Set(parsed)]; // deduplicate
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
