# Regroupement des thématiques : 56 → 28

Objectif : réduire la liste des thématiques à 28 catégories officielles et reclasser automatiquement tous les conférenciers concernés.

## Les 28 catégories conservées

1. Adaptabilité
2. Audace
3. Bien-être au travail (← Bienveillance)
4. Cohésion d'équipe (← Collectif, Esprit d'équipe, Performance collective, Intelligence collective)
5. Communication (← Prise de parole, Marketing)
6. Conduite du changement
7. Confiance (← Confiance en soi)
8. Dépassement de soi/Motivation (← Dépassement de soi, Motivation)
9. Diversité et handicap (← Handicap, Parité, Diversité et inclusion)
10. Économie (← Géopolitique)
11. Engagement
12. Entrepreneuriat
13. Environnement (← Développement durable et environnement)
14. Expérience client
15. Gestion de crise (← Gestion des conflits, Gestion du stress)
16. Gestion des risques (← Maîtrise des risques, Cybersécurité)
17. Innovation (← Créativité)
18. Intelligence artificielle
19. Intelligence émotionnelle (← Gestion des émotions, Intelligence relationnelle, Facteur humain)
20. Jeunes générations
21. Leadership
22. Management
23. Négociation
24. Optimisme
25. Performance
26. Prise de décision (← Biais cognitifs, Désinformation, Esprit critique)
27. Résilience (← Gestion de l'échec, Droit à l'erreur)
28. Transformation (← Transformation digitale, Stratégie)

Supprimées sans remplacement : Empowerment, Expérience collaborateur, Neurosciences, Storytelling (seul Neurosciences est encore utilisé, par 3 conférenciers) ainsi qu'une étiquette vide présente en base.

## Ce qui change concrètement

- Chaque conférencier voit ses anciennes étiquettes remplacées par la catégorie parente, sans doublon (un conférencier « Cohésion d'équipe » + « Esprit d'équipe » n'aura plus qu'une seule étiquette).
- Les filtres de l'annuaire public, le simulateur de conférencier et le CRM n'affichent plus que ces 28 catégories.
- Les imports et enrichissements automatiques ne peuvent plus créer d'étiquette hors de cette liste.
- Aucun conférencier n'est supprimé ni archivé ; seules les étiquettes changent.

## Détails techniques

1. `src/lib/parseThemes.ts` : remplacer `CANONICAL_THEMES` par les 28 entrées et réécrire `THEME_ALIASES` pour que chaque ancienne thématique (et ses variantes de casse/accents) pointe vers sa catégorie parente ; les 4 thématiques supprimées renvoient une chaîne vide et sont filtrées.
2. Migration de données (UPDATE sur `speakers.themes`) : remapper les tableaux existants via la même table de correspondance, dédupliquer, retirer les valeurs vides et les 4 thématiques supprimées.
3. Synchroniser les listes dupliquées côté serveur : `supabase/functions/import-speakers/index.ts`, `supabase/functions/search-competitor-speakers/index.ts` (liste du prompt IA + `CANONICAL_THEMES` de normalisation).
4. `src/components/SpeakerSimulator.tsx` : aligner la constante `THEMES` sur la nouvelle liste.
5. Vérifier l'affichage des filtres dans `src/pages/Speakers.tsx` et du CRM (`AdminSpeakersCRM.tsx`), qui dérivent déjà de `CANONICAL_THEMES`.
6. Contrôle post-migration : requête de comptage par thématique pour confirmer qu'il ne reste que les 28 valeurs attendues.
