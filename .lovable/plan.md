## Hero accueil — remplacement du picker thématique par un double CTA

Dans `src/pages/Index.tsx`, section Hero (lignes 253-273) :

- Supprimer le bloc `{/* Category search ... */}` (boutons thématiques `topThemes` + bouton "Tous les conférenciers →").
- Supprimer le bloc CTA mobile (lignes 228-238) — devenu redondant avec le nouveau double CTA visible sur toutes tailles.
- Le remplacer par un double bouton centré, responsive (column sur mobile, row sur ≥sm) :
  1. **Trouver un conférencier** — bouton mis en avant (jaune `bg-accent text-accent-foreground`), → `navigate("/conferencier")`
  2. **Demander un devis** — bouton secondaire (`variant="outline"` style transparent sur fond sombre, bordure `border-primary-foreground/30`), → `navigate("/contact")`
- Conserver le reste du Hero inchangé (titre, sous-titre, pills de réassurance, étoiles 5/5).
- Nettoyer l'import/usage de `topThemes` s'il n'est plus utilisé ailleurs dans le fichier (à vérifier).

Hors scope : autres sections de la home, pages internes.
