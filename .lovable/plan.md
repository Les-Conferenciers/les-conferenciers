## Objectif

Afficher et permettre l'édition des numéros de téléphone client et conférencier sur la feuille de liaison publique (`/feuille-liaison/:token`), sans toucher aux numéros stockés dans `clients.phone` ou `speakers.phone`.

## Constat

- Les téléphones sont déjà affichés dans `src/pages/LiaisonSheetView.tsx` (section "Contact", lignes 271-284).
- Côté client, le fallback est : `event.contact_on_site_phone || proposal.client_phone`.
- Côté conférencier, c'est `speaker.phone` direct, **pas de champ d'override**.
- La table `events` possède déjà deux colonnes parfaites pour stocker les overrides sans toucher au profil de référence :
  - `contact_on_site_phone` (déjà utilisé pour le client)
  - `speaker_contact_phone` (existe mais pas utilisé dans la vue)

## Modifications (frontend uniquement, 1 fichier)

`src/pages/LiaisonSheetView.tsx` :

1. Ajouter deux états locaux `clientPhone` et `speakerPhone` initialisés depuis :
   - `clientPhone` ← `ev.contact_on_site_phone || proposal.client_phone || ""`
   - `speakerPhone` ← `ev.speaker_contact_phone || speaker.phone || ""`

2. Dans la section "Contact" (lignes 273-284) :
   - En mode lecture : afficher `Nom - téléphone` comme aujourd'hui mais à partir des nouveaux états.
   - En mode `editing` : remplacer l'affichage du téléphone par un `<input>` éditable (style cohérent avec les autres champs éditables de la page).

3. Dans la fonction de sauvegarde (mode édition), persister :
   - `events.contact_on_site_phone = clientPhone`
   - `events.speaker_contact_phone = speakerPhone`
   
   Les tables `clients` et `speakers` ne sont jamais touchées : le numéro de référence en base reste intact, seul l'override propre à cet événement est mis à jour.

## Hors scope

- Aucun changement de schéma DB (les colonnes existent déjà).
- Aucun changement dans l'admin / EventDossier (la feuille publique est éditable in-line par l'utilisateur authentifié).
- Pas de modification des emails de liaison.
