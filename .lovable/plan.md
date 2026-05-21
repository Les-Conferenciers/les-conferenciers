## 20 profils featured sur la home

### Constat
- La section Home utilise déjà un **carrousel** (`FeaturedSpeakers.tsx`) qui charge tous les conférenciers `featured = true` triés par `featured_order`. Il affiche 5 cartes visibles sur desktop, 3 sur tablette, ~2 sur mobile, avec autoplay (5s) et boucle.
- La seule vraie limite "5" est dans le CRM admin : le champ `featured_order` a un `max={5}`, ce qui bloque l'utilisateur à 5 mises en avant.

### Changement proposé (UX cohérente)
Garder strictement le **même carrousel** (même style de cartes, même autoplay, mêmes flèches), juste avec plus de slides — c'est déjà l'UX la plus cohérente avec le site, et ça évite une grille géante qui alourdirait la home.

1. **Lever la limite admin** : `featured_order` passe de `max={5}` à `max={20}` dans `AdminSpeakersCRM.tsx`. Le label passe de "1 à 5" à "1 à 20".
2. **Rythme du carrousel** : conserver `basis-1/5` (5 cartes visibles desktop). Avec 20 profils, l'utilisateur fait défiler 4 "pages". Loop déjà actif, autoplay déjà actif. Rien d'autre à toucher.
3. **Skeleton de chargement** : passer de 4 à 5 placeholders pour matcher le carrousel (cohérence visuelle pendant le chargement).
4. **Mémoire projet** : mettre à jour `mem://features/featured-speakers` (6 → 20).

### Hors scope
- Pas de refonte de la grille / pas de nouveau layout.
- Pas de changement sur la page `/conferenciers`.
- Pas de modification de `SpeakerCard`.

### Fichiers touchés
- `src/components/FeaturedSpeakers.tsx` (skeleton x5)
- `src/components/admin/AdminSpeakersCRM.tsx` (max 20 sur `featured_order`)
- `mem://features/featured-speakers`
