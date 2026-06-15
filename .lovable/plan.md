## Diagnostic — Core Web Vitals mobile (Search Console)

D'après ton rapport :
- **CLS > 0,25** sur ~169 URL → critique
- **LCP > 2,5 s** sur ~175 URL → à améliorer
- **INP** déjà OK

Les URL concernées sont quasi exclusivement les **fiches conférenciers** (300+ pages = 95 % du site). Les deux problèmes ont des causes identifiées dans le code :

### CLS — gros décalage de mise en page

Le squelette de chargement (`SpeakerDetail.tsx` lignes 483-500) ne correspond pas du tout à la hauteur réelle du hero :
- skeleton : médaillon 32×32 + 3 lignes courtes (~280 px de haut)
- contenu réel : médaillon 44×44 + H1 + sous-titre + badges thèmes + 4 pépites + bouton CTA (~520 px+)

→ Quand les données Supabase arrivent, tout le bas de page « saute » de 200-300 px = CLS énorme.

Autres contributeurs CLS :
- Images du HTML biographie sans `width`/`height` réservés (CSS `[&_img]:h-auto`)
- Polices Playfair (H1 `text-5xl`) chargées en `media="print"` → FOUT marqué sur mobile
- Section `SpeakerReviews` qui apparaît après chargement Google Places API

### LCP — image hero pas optimisée

- L'élément LCP sur fiche = **photo du conférencier** (Supabase storage), pas préchargée
- `index.html` précharge à la place `og/lesconferenciers.jpg` (1200×630) qui ne sert qu'au social → bande passante gaspillée et préempte la vraie image LCP
- Photos Supabase servies sans transformations (souvent 1500-2500 px)
- Fonts Google chargées en bloquant via `<link rel="stylesheet" media="print" onload>` + `noscript` fallback OK, mais Playfair pèse lourd

## Plan d'action

### 1. Fix CLS prioritaire — squelette de fiche

Refondre le skeleton dans `SpeakerDetail.tsx` pour qu'il **reproduise la hauteur réelle** du hero (médaillon 44×44, H1 ~48 px, badges thèmes ~32 px, 4 lignes pépites, bouton CTA). Réserver aussi une hauteur min sur la section biographie (`min-h-[600px]`) tant que le contenu n'est pas chargé.

### 2. Réserver les dimensions des images de biographie

Dans la chaîne `sanitizeConferenceHtml` :
- Ajouter `loading="lazy"` + `decoding="async"` à chaque `<img>` qui n'en a pas
- Ajouter un wrapper avec aspect-ratio inline si l'image a `width` mais pas `height` (ou inverser).
- Sur `.bio-image-block img`, fixer `aspect-ratio` CSS pour éviter le shift au load.

### 3. Précharger la vraie LCP image

- **Retirer** le `<link rel="preload" as="image" href=".../og/lesconferenciers.jpg">` de `index.html` (n'est jamais l'élément LCP sur les fiches, ni sur l'accueil — l'accueil utilise un fond Supabase déjà géré dans le composant Hero).
- Sur `SpeakerDetail`, ajouter dynamiquement un `<link rel="preload" as="image">` pointant sur `speaker.image_url` dès que le slug est résolu (via `react-helmet-async` si dispo, sinon append manuel comme déjà fait pour les meta).
- L'image hero a déjà `fetchPriority="high"` + `decoding="sync"` — bon.

### 4. Réduire le poids des photos speaker (gain LCP majeur)

Deux options, je propose la première :
- **A. Transformer à la volée via Supabase** : remplacer les URL `/storage/v1/object/public/...` par `/storage/v1/render/image/public/...?width=400&quality=75&format=origin` côté listing et `?width=600` côté hero détail. Gain : 60-80 % de poids.
- B. (plus lourd) rehéberger en WebP optimisé — déjà fait selon `mem://tech/data-management/speaker-assets-storage`, donc à vérifier d'abord.

### 5. Polices

- Précharger uniquement le **woff2 Playfair-700** (utilisé par H1) en `<link rel="preload" as="font" crossorigin>` → réduit le FOUT le plus visible.
- Garder Inter en swap normal (peu de différence visuelle avec la fallback sans-serif).

### 6. Vérifier après déploiement

- PageSpeed Insights sur 2-3 fiches représentatives (`/conferencier/xxx`).
- Demander un nouveau scan Search Console (28 jours pour validation).

---

## Ce que je ne touche pas (déjà OK)

- INP (mémoire `mem://tech/performance/core-web-vitals` indique déjà React.lazy + content-visibility).
- Le format des photos déjà rehébergées (à confirmer rapidement avant action #4).
- Le tracking Google Ads, le sitemap, les canonicals (sans rapport avec les Web Vitals).

---

## Si tu valides

Je commence par les **fixes #1 (skeleton hero) et #3 (preload image LCP + retrait preload OG)** qui adressent ~80 % du problème CLS et LCP sans risque. Puis #2 (images bio), #4 (transformations Supabase), #5 (preload font) en deuxième passe.

Ordre proposé : 1 → 3 → 4 → 2 → 5.