## Objectif

Rendre chaque landing `/conferencier/profil/{slug}` éditable (title, H1, sous-titre), retirer les filtres thématiques, permettre d'ajouter manuellement des conférenciers d'autres profils, grouper Militaires + GIGN, ajouter un CTA contact, et pré-remplir des contenus SEO par défaut pour les 16 profils.

## 1. Migration BDD

Ajouts sur `speaker_profiles` :
- `subtitle` (text) — sous-titre sous le H1
- `cta_text` (text) — texte du bloc CTA (avec valeur par défaut générique)
- `cta_button_label` (text, défaut `"Nous contacter"`)
- `linked_profile_ids` (uuid[]) — profils additionnels à fusionner dans le listing (ex: GIGN ↔ Militaires)
- `extra_speaker_ids` (uuid[]) — conférenciers ajoutés manuellement venant d'autres profils

Puis script de seed (INSERT tool) qui remplit pour les 16 profils existants :
- `seo_title` : `Conférenciers {profil} — Les Conférenciers` (variantes optimisées par profil)
- `meta_description` : phrase SEO unique par profil (~150 caractères)
- `landing_label` (H1) : `Conférenciers {profil}` adapté
- `subtitle` : variante du "Parmi nos 300 conférenciers d'exception, trouvez celui qui marquera votre événement."
- `cta_text` : texte demandé par l'utilisateur
- 4-5 questions FAQ génériques par profil (tarif, disponibilité, format, thèmes abordés, modalités) pour booster le SEO
- Groupement : `Anciens du GIGN` ↔ `Militaires` liés mutuellement via `linked_profile_ids`

## 2. Public — `src/pages/ProfileLanding.tsx`

- Afficher `landing_label` (H1) + `subtitle` (paragraphe sous le H1)
- **Supprimer** la barre de filtres par thème (et le state `selectedTheme`)
- Charger les conférenciers où `profile_id IN (profile.id + linked_profile_ids)` UNION `id IN extra_speaker_ids`, dédupliqués, triés par `display_order` puis nom
- Bloc CTA sous le listing : utiliser `cta_text` et `cta_button_label` (déjà présent visuellement, juste branché sur les nouveaux champs)
- FAQ inchangée à la fin (JSON-LD déjà présent)
- `<title>` = `seo_title`, fallback `landing_label`

## 3. Admin — `src/components/admin/AdminLandingPages.tsx`

Dans chaque accordéon de profil, ajout des champs :
- Titre H1 (déjà là, libellé clarifié)
- **Nouveau** Sous-titre (Input)
- SEO title + Meta description (déjà là)
- Intro (HTML) — conservé
- **Nouveau** Texte CTA (Textarea) + libellé bouton (Input)
- **Nouveau** Profils liés (multi-select des autres profils — fusionne les listings dans les 2 sens si l'utilisateur les lie chacun)
- **Nouveau** Conférenciers additionnels (recherche + ajout d'IDs depuis n'importe quel profil, liste avec retrait)
- FAQ (déjà là)

## 4. Hors scope

- Pas de changement aux fiches conférenciers ni au CRM
- Pas de modification du sitemap (URLs identiques)
- Pas d'image héro éditable (réutilise l'OG actuelle)

## Détails techniques

- Le groupement Militaires/GIGN sera bidirectionnel : seed remplit `linked_profile_ids` dans les deux profils. L'admin l'expose pour que d'autres groupes puissent être créés ensuite.
- Requête speakers : `or(profile_id.in.(...),id.in.(...))` côté Supabase ; dédup en JS.
- Types Supabase régénérés après migration avant édition du code TS.
