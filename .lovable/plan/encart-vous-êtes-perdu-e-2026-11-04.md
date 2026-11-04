# Encart "Vous êtes perdu.e ?"

- Afficher l'encart à la 12e place du listing (après le 12e conférencier), une seule fois. Si la liste filtrée compte moins de 12 profils, il reste affiché en fin de liste.
- Remplacer le titre par "Vous êtes perdu.e ?".

## Technique
- `src/pages/Speakers.tsx` : remplacer la logique `HELP_CARD_EVERY = 75` par une position fixe `HELP_CARD_POSITION = 12` (condition `i + 1 === 12`, ou dernier élément si moins de 12 résultats et plus rien à charger).
- `src/components/SpeakersHelpCard.tsx` : texte `perdu ?` → `perdu.e ?`.
