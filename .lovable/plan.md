## Refonte UX/UI du bloc éditorial SEO (landings)

### Objectifs
- Aérer la lecture, hiérarchie claire, rythme visuel CRO (scan → preuve → action).
- Édition admin via éditeur de texte riche (pas de textarea brute).
- Bloc "Pourquoi l'agence" repositionné comme encart de réassurance différenciant.
- "Points clés" recontextualisés autour du type de profil (titre, intro courte).

---

### 1. Page publique `ProfileLanding.tsx` — refonte visuelle

**Chapô intro**
- Bandeau d'introduction `max-w-3xl mx-auto` centré, typo `text-xl leading-[1.8]`, premier mot/phrase en `drop-cap` éditorial (lettrine accent gold).
- Rendu HTML (issu du rich text editor) au lieu de `whitespace-pre-line` → vrais paragraphes espacés (`prose-styles` avec `space-y-5`).

**Bloc "Points clés" — recontextualisé**
- Nouveau titre dynamique : « Pourquoi choisir un·e {profile.landing_label} » (généré par IA dans le JSON sous `key_points_title`) + sous-titre court (1 phrase) `key_points_intro`.
- Grille `md:grid-cols-3` de cartes avec icône `Sparkles`/`Check`/`Target`, titre court (`label`) + 1 phrase d'appui (`description`). Structure JSON enrichie : `key_points: [{label, description}]`.
- Fond `bg-card`, bordure douce, `hover:shadow-md transition`, padding généreux.

**Sections thématiques**
- Largeur `max-w-3xl`, `space-y-16` entre sections.
- `<h2>` `text-3xl font-bold` avec barre accent à gauche (`border-l-4 border-accent pl-4`).
- Corps rendu HTML (prose) avec paragraphes aérés (`leading-[1.8]`, `space-y-4`).
- Conférenciers cités : grille `sm:grid-cols-3` de mini-cartes (photo ronde 64px + nom + rôle), hover gold, fond `bg-muted/40` `rounded-xl p-4`.

**Encart "Pourquoi faire appel à notre agence" — repositionné juste avant le CTA contact**
- Encart premium pleine largeur `max-w-4xl`, fond `bg-primary` texte clair, accent gold, coins `rounded-3xl`, ombre `shadow-xl`.
- Layout 2 colonnes : à gauche titre + texte ; à droite 3 piliers en liste avec icônes :
  1. **Connaissance fine des profils** (on rencontre, briefe et suit nos conférenciers)
  2. **Maîtrise du contenu des conférences** (on connaît leurs sujets, angles, formats)
  3. **Matching événement × audience × conférencier** (recommandation sur-mesure)
- CTA secondaire intégré « Parler à un conseiller » → `/contact`.
- Suppression de l'ancien encart fond `bg-primary/5` simple.

**Espacement global**
- `mt-24` après la grille de conférenciers, `space-y-20` entre blocs.

---

### 2. Édition admin `AdminLandingPages.tsx` — éditeur riche

- Remplacer chaque `<Textarea>` du contenu éditorial par `<SimpleRichTextEditor>` (composant existant) pour : `intro`, `sections[].body`, `why_agency`.
- Champs texte courts en `<Input>` : `key_points_title`, `key_points_intro`, `sections[].title`, `key_points[].label`, `key_points[].description`.
- Wording UI ajusté : « Chapô d'introduction », « Sections de contenu », « Points clés du profil (titre + intro + 3 à 6 cartes) », « Encart Pourquoi l'agence ».
- Bouton « Générer avec l'IA » inchangé mais prompt mis à jour pour produire la nouvelle structure JSON.

---

### 3. Edge function `generate-landing-content` — schéma mis à jour

Nouveau JSON cible :
```json
{
  "intro": "<p>…</p><p>…</p>",
  "key_points_title": "Pourquoi choisir un·e {profil}",
  "key_points_intro": "Une phrase qui plante le décor.",
  "key_points": [
    { "label": "…", "description": "…" }
  ],
  "sections": [
    { "title": "…", "body": "<p>…</p>", "speaker_ids": ["…"] }
  ],
  "why_agency": "<p>Connaissance des profils… contenu des conférences… matching…</p>"
}
```
- Prompt enrichi : insister sur connaissance des profils, des contenus des conférences, et expertise de matching événement/audience/conférencier dans `why_agency`.
- Contenu HTML léger autorisé (`<p>`, `<strong>`, `<ul>`, `<li>`) pour l'éditeur riche.
- Tonalité, apostrophes droites, anti-plagiat inchangés.

---

### 4. Compatibilité ancien format
- Si `key_points` est un tableau de strings (ancien format), le mapper à `{label: str, description: ""}` côté front pour ne rien casser.
- Si `intro` / `why_agency` sont en texte brut, les afficher en `<p>` simples.

---

### Hors scope
- Pas de changement sur le hero, la grille de conférenciers, les FAQ, le CTA contact existant en bas, le CRM.
- Pas de migration BDD (la colonne `rich_content` JSONB accepte le nouveau schéma).
- Pas de régénération automatique pour toutes les landings existantes.
