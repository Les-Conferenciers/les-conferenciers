# Annuaire /conferencier : encart "Vous êtes perdu ?" + filtres

## 1. Encart "Vous êtes perdu ?" dans la grille
- Une carte de la même taille qu'un profil, insérée dans la grille tous les 75 profils (après le 75e, 150e…), et aussi en fin de liste si moins de 75 résultats (ex. après filtrage).
- Fond sombre de la marque (bleu nuit), titre "Vous ne savez pas qui choisir ?" avec "perdu ?" en accent doré, sous-texte : "Dites-nous votre événement, Nelly vous propose une sélection sur mesure sous 24 h." Bouton "On vous guide →" vers /contact.
- Non cliquable en entier sauf le bouton ; accessible (lien explicite), sans image lourde (pas d'impact LCP/CLS).

## 2. Barre de filtres
Remplace les pastilles actuelles de thématiques (une seule thématique possible) par :
- **Recherche par mot-clé** discrète : petit champ avec loupe, aligné à droite (nom, rôle, biographie).
- **Thématiques à cocher** : bouton "Thématiques" ouvrant une liste à cases (28 thématiques canoniques), plusieurs choix possibles ; un profil apparaît s'il a au moins une thématique cochée.
- **Types de profils** : bouton "Profils" ouvrant une liste à cases (Anciens du GIGN et RAID, Expert, Chef d'orchestre…, issus des profils de l'admin avec page active).
- Pastilles des filtres actifs avec croix + "Tout effacer" ; compteur "X conférenciers".
- Filtres conservés dans l'URL (partage / retour arrière), anciens liens `?theme=` toujours valides.
- Mobile : les deux boutons et la recherche s'empilent proprement.

## Détails techniques
- `src/pages/Speakers.tsx` : états `selectedThemes[]`, `selectedProfiles[]`, params `themes`, `profiles`, `search` ; requête des `speaker_profiles` (id, name) ; filtre par `speaker.profile_id` ou `extra_speaker_ids` du profil.
- Popovers shadcn + Checkbox ; nouveau composant `SpeakersHelpCard.tsx` ; rendu de la grille via fragments pour insérer la carte à l'index `(i+1) % 75 === 0`.
- Couleurs via tokens existants, aucune couleur codée en dur.
