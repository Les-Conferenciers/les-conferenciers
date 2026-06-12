## Refonte simplifiée du contenu éditorial des landings profil

### 1. Page publique `ProfileLanding.tsx`

**Nouvel ordre des blocs après la grille de conférenciers :**

```text
[Grille conférenciers]
   ↓
[CTA "Tous nos conférenciers ne sont pas présents…"]   ← remonté ici
   ↓
[Bloc "Ce que ces profils apportent à votre événement"] (key_points - inchangé)
   ↓
[Bloc unique "Pourquoi inviter un Conférencier [profil] à votre événement"]
   ↓
[Encart "Pourquoi faire appel à notre agence"] (inchangé)
   ↓
[FAQ]
```

**Suppressions :**
- Bloc chapô (`rc.intro`) supprimé du rendu public.
- Vignettes de conférenciers cités dans les sections (`citedSpeakers` map) supprimées.

**Bloc unique fusionné :**
- Titre fixe : `Pourquoi inviter un·e {profile.landing_label} à votre événement`.
- Corps : concaténation HTML des `sections[].body` (sous-titres `sections[].title` rendus comme `<h3>` internes pour garder la hiérarchie de lecture), rendu via `prose` aéré.
- Plus aucun affichage de `speaker_ids` côté public.

**CTA remonté :**
- Déplacer le bloc "Tous nos conférenciers…" directement sous la grille `SpeakerCard`, avant les blocs éditoriaux.

### 2. Admin `AdminLandingPages.tsx`

- Retirer le champ "Chapô d'introduction" (l'éditeur `intro`).
- Conserver "Points clés du profil" (titre + intro + cartes).
- Garder le tableau de `sections` (titre + body riche) — c'est la matière brute du bloc fusionné, l'admin peut continuer à structurer en sous-parties.
- Conserver "Pourquoi l'agence".
- Le champ `intro` reste dans le JSON (compatibilité) mais n'est plus édité ni affiché.

### 3. Edge function `generate-landing-content`

- Mettre à jour le prompt : ne plus demander de chapô (`intro` peut être vide ou retiré).
- Garder `key_points_*`, `sections[]`, `why_agency`.
- Préciser dans le prompt que les `sections` seront affichées comme un seul bloc continu sous le titre "Pourquoi inviter un Conférencier [profil] à votre événement" — donc viser 2 à 4 sous-parties cohérentes (raisons, contextes d'intervention, typologies de profils) sans répéter les noms de conférenciers individuels.
- Supprimer la demande de `speaker_ids` par section (plus utilisée à l'affichage).

### Hors scope
- Hero, FAQ, encart agence (design conservé).
- Pas de migration BDD.
- Pas de régénération automatique du contenu existant.
