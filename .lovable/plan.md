# Profils conférenciers + landings dédiées

## 1. Modèle de données (backend)

### Table `speaker_profiles`
- `slug` (texte, unique, ex: `anciens-du-gign`) — sert d'URL
- `name` (texte, ex: "Anciens du GIGN") — libellé interne
- `landing_label` (texte, ex: "Conférenciers anciens du GIGN") — H1 de la landing
- `landing_enabled` (bool) — true seulement pour les profils qui ont une landing publique
- `seo_title`, `meta_description` (textes)
- `intro_html` (texte riche) — paragraphe d'intro de la landing
- `faq` (JSONB, tableau `[{question, answer}]`) — éditable dans l'admin
- `display_order` (int)
- RLS : lecture publique, écriture admin uniquement

### Table `speakers`
- Ajout `profile_id` (uuid, FK nullable vers `speaker_profiles`)
- Un seul profil par conférencier (relation 1↔N)

### Profils initiaux (16) à seeder
Anciens du GIGN, Astronautes, Navigateurs, Rugbymen, Artistes, Économistes, Philosophes, Experts IA, Chefs d'entreprise, Sportifs de haut niveau, Aventuriers / explorateurs, Chefs cuisiniers, Journalistes, Scientifiques, Militaires (hors GIGN), Médecins.

Sur les 16, ces 7 auront `landing_enabled = true` dès le départ : Navigateurs, IA, Astronautes, Rugby, GIGN, Économistes, Philosophes.

### Affectation initiale des 204 conférenciers actifs
Script d'auto-attribution depuis `role`/`themes`/`biography` (mots-clés : "GIGN", "astronaute", "navigateur", "rugby", "philosophe", "économiste", "chef cuisinier", "artiste", "IA / intelligence artificielle", etc.). Si rien ne matche, fallback `Chefs d'entreprise`. Tu réajustes ensuite manuellement dans le sous-onglet "Profils".

## 2. Sous-onglet "Profils" (sous CRM speakers)

Nouveau composant `AdminSpeakerProfiles.tsx`, ajouté comme sous-onglet de CRM speakers.

Vue tableau de tous les conférenciers actifs :
- Colonnes : Photo, Nom, Rôle, Thèmes, **Profil (Select inline éditable)**
- Filtres en haut : Recherche texte, filtre par profil (multi), filtre "sans profil"
- Bulk action : sélection multiple → assignation d'un profil
- Compteur par profil affiché en haut

Édition rapide : changer le `Select` d'une ligne enregistre immédiatement dans Supabase.

## 3. Sous-onglet "Landings" (sous CRM speakers)

Nouveau composant `AdminLandingPages.tsx`.

Liste des profils avec :
- Toggle `landing_enabled`
- Édition inline : slug, H1, SEO title, meta description, intro, FAQ (éditeur question/réponse avec ajout/suppression/réordonnancement)
- Bouton "Voir la landing" → ouvre `/conferencier/profil/{slug}` dans un nouvel onglet
- Compteur de conférenciers rattachés

## 4. Landing page publique

### URL
`https://www.lesconferenciers.com/conferencier/profil/{slug}`
(évite la collision avec la route existante `/conferencier/:slug` des fiches conférenciers)

### Composant `ProfileLanding.tsx`
Structure quasi identique à `/conferencier?theme=…` :
1. Hero (même image de fond) avec H1 = `landing_label`, sous-titre = `intro_html` (court)
2. Grille des conférenciers du profil (mêmes `SpeakerCard`, tri par `display_order`)
3. Filtres thèmes (réutilisés depuis `Speakers.tsx`)
4. Bloc FAQ éditorial (Accordion shadcn) + JSON-LD `FAQPage`
5. CTA "Nous contacter" identique
6. Balises SEO dynamiques (title, description, canonical, OG) — utilise `seo_title` / `meta_description` du profil

### SEO
- Ajout de chaque profil `landing_enabled = true` au sitemap (edge function `generate-sitemap`)
- JSON-LD `FAQPage` injecté
- Canonical : `https://www.lesconferenciers.com/conferencier/profil/{slug}` (sans slash final)

## 5. Détails techniques

- Migration Supabase : table `speaker_profiles` + colonne `speakers.profile_id` + RLS (lecture publique, écriture admin via `has_role('admin')`) + GRANTs
- Seed des 16 profils via INSERT
- Script d'auto-mapping initial des 204 conférenciers (via `supabase--insert`)
- `App.tsx` : nouvelle route `<Route path="/conferencier/profil/:slug" element={<ProfileLanding />} />`
- Mise à jour edge function `generate-sitemap` pour inclure les profils avec landing activée
- Aucun changement aux pages publiques existantes hors ajout de la route

## Hors scope (pour plus tard)
- Templates de proposition par profil (l'infra data sera prête : `proposals` pourra lire `speakers.profile_id`)
- Export / import CSV des affectations
- Multi-profils par conférencier
