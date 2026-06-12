## Bloc de contenu SEO riche après le listing (landings)

### 1. Base de données (migration)
Ajouter deux colonnes à `speaker_profiles` :
- `rich_content` (jsonb) — contenu structuré généré par IA
- `rich_content_updated_at` (timestamptz)

Structure JSON attendue :
```json
{
  "intro": "200-300 mots d'intro contextuelle",
  "sections": [
    { "title": "Pourquoi faire appel à un [profil]", "body": "…" },
    { "title": "Dans quels contextes les inviter", "body": "…" },
    { "title": "Notre sélection de profils", "body": "…", "speakers": ["id1","id2","id3"] }
  ],
  "why_agency": "Pourquoi passer par l'agence Les Conférenciers",
  "key_points": ["point fort 1", "point fort 2", "…"]
}
```

### 2. Edge function `generate-landing-content`
- Input : `profile_id`
- Récupère le profil (nom, landing_label, subtitle), la liste des conférenciers associés (nom + rôle + 2-3 lignes de bio) et les profils liés
- Appelle Lovable AI (Gemini) avec un prompt strict :
  - Tonalité éditoriale "Les Conférenciers" (premium, francophone, factuel, apostrophes droites)
  - 200-300 mots d'intro + 3 sections thématiques + bloc "Pourquoi l'agence"
  - Cite 2-3 conférenciers du profil en exemple (nom + rôle), pas de plagiat
  - Interdit : copier toute formulation d'un site concurrent, mentionner des agences concurrentes, gras automatique
  - Sortie JSON structurée (schema strict)
- Sauvegarde dans `rich_content` + timestamp

### 3. Admin `AdminLandingPages.tsx`
Remplacer le `<Textarea>` "Intro complémentaire (HTML)" par un nouveau bloc **"Contenu éditorial SEO (généré par IA)"** :
- Bouton **"Générer avec l'IA"** (ou "Régénérer" si déjà présent) → appelle l'edge function, toast de progression
- Aperçu structuré éditable inline : intro, sections (titre + texte), bloc "pourquoi l'agence", key points (chip list), conférenciers cités (multi-select parmi ceux du profil)
- Boutons "Ajouter une section" / supprimer / réordonner
- Date de dernière génération affichée
- L'ancien champ `intro_html` est conservé pour ne rien casser mais déplacé dans un sous-bloc "Avancé (HTML legacy)"

### 4. Page publique `ProfileLanding.tsx`
Nouveau composant `<LandingRichContent profile={...} speakers={...} />` inséré **après la grille de conférenciers et avant le bloc CTA "Nous contacter"** :
- Mise en page éditoriale en `max-w-4xl mx-auto`
- Intro en chapô (typo plus grande, leading généreux)
- Sections en `<h2>` + paragraphes, alternance fond `bg-card`/transparent pour le rythme
- Bloc "key points" en grille d'icônes (lucide `Check`/`Sparkles`)
- Bloc "Pourquoi faire appel à l'agence" mis en avant (fond `bg-primary/5`, bordure `border-accent`)
- Vignettes médaillon (rondes) des conférenciers cités, cliquables vers leur fiche
- Pas de copie d'image ni de texte d'un site concurrent
- Si `rich_content` vide → bloc masqué (pas de fallback texte)

### 5. SEO
- `<h2>` sémantiques pour chaque section (le `<h1>` reste celui du hero)
- Contenu rendu côté React (SPA) — pas de SSR ajouté
- Le contenu reste éditable manuellement après génération

### Hors scope
- Pas de changement sur les filtres, le hero, les FAQ existantes, l'image héro, le CRM
- Pas de génération automatique pour toutes les landings d'un coup (un bouton par landing)
- Pas de migration des `intro_html` existants vers le nouveau format
