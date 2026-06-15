## Objectif
Optimiser la page `/conferencier` (`src/pages/Speakers.tsx`) pour la requête SEO **« trouver un conférencier »** et ajouter une FAQ riche en bas de page.

## 1. Balises SEO (Head)

Mise à jour dans le `useEffect` SEO de `Speakers.tsx` :

- **`<title>`** (< 60 car.) :
  `Trouver un conférencier pour votre événement | Les Conférenciers`
- **`<meta name="description">`** (< 160 car.) :
  `Trouver un conférencier professionnel adapté à votre événement : 300+ profils experts, accompagnement sur mesure et devis rapide partout en France.`
- **`<link rel="canonical">`** : `https://www.lesconferenciers.com/conferencier` (déjà présent, vérifié — sans slash final conformément à la règle projet).
- **Open Graph / Twitter** : ajout dynamique des balises `og:title`, `og:description`, `og:url`, `og:type=website`, `twitter:card`, `twitter:title`, `twitter:description` synchronisées avec le title/description ci-dessus (création/MAJ + cleanup au démontage).
- **`<meta name="robots" content="index, follow">`** explicite.

## 2. Structure Hn et contenu visible

Dans le hero existant :
- **`<h1>`** remplacé par : `Trouver un conférencier pour votre événement`
- **Sous-titre** (`<p>`) : `Plus de 300 conférenciers professionnels et personnalités d'exception. Trouvez en quelques clics le profil idéal pour marquer votre événement d'entreprise.`

Ajout d'un court paragraphe d'introduction SEO (1-2 phrases, sous les filtres ou au-dessus de la grille) pour densifier le champ lexical (« conférencier professionnel », « intervenant », « keynote speaker », « événement entreprise »), sans casser la mise en page actuelle.

Les titres de filtres restent en éléments visuels (pas de `h2` parasite). Le bloc CTA existant garde sa structure.

## 3. Nouvelle section FAQ (en bas de page, avant le Footer)

Composant inline utilisant `Accordion` shadcn (déjà dispo), titre `<h2>` : **« Questions fréquentes pour trouver un conférencier »**.

Questions ciblées (issues de la SERP « trouver un conférencier ») :
1. Comment trouver un bon conférencier pour son événement ?
2. Quel est le tarif d'un conférencier professionnel ?
3. Combien de temps à l'avance réserver un conférencier ?
4. Quelle différence entre un conférencier, un intervenant et un keynote speaker ?
5. Comment choisir le conférencier adapté à son thème et son audience ?
6. Pourquoi passer par une agence de conférenciers ?
7. Peut-on faire intervenir un conférencier en visio ou à l'étranger ?
8. Que comprend la prestation d'un conférencier (préparation, voyage, droits) ?

Réponses rédigées 2-4 phrases, ton agence (vouvoiement, professionnel), apostrophes droites, lien interne vers `/contact` dans 1-2 réponses pour booster maillage + conversion.

## 4. JSON-LD structuré

Injection dans le head (via `useEffect`) de deux scripts `application/ld+json` :
- **`FAQPage`** reprenant exactement les 8 Q/R (texte brut, sans HTML), pour éligibilité aux rich snippets FAQ Google.
- **`CollectionPage`** + `breadcrumb` (`BreadcrumbList` : Accueil › Conférenciers) pour signaler la nature de listing.

Les scripts sont créés avec `id` dédiés et supprimés au démontage pour éviter les doublons sur navigation SPA.

## 5. Best practices techniques vérifiées

- `ScrollToTop` global déjà actif (mémoire projet) — OK.
- Sitemap dynamique inclut déjà `/conferencier` (généré côté edge function) — pas de modif.
- `robots.txt` : déjà `Allow: /` — pas de modif.
- Lazy-loading images conférenciers déjà en place dans `SpeakerCard`.
- Balise `<main>` : la page utilise actuellement des `<section>`/`<div>`. Ajout d'un wrapper `<main>` autour du contenu central pour clarifier la structure sémantique aux crawlers.
- Vérification : pas de `noindex`, un seul `<h1>`, hiérarchie h1 → h2 (FAQ) cohérente.

## Hors scope
- Pas de modification de la grille / filtres / logique de pagination.
- Pas de refonte visuelle du hero (seul le texte change).
- Pas de changement backend ni de schéma BDD.

## Fichiers touchés
- `src/pages/Speakers.tsx` (head, h1, intro, wrapper `<main>`, FAQ, JSON-LD).
