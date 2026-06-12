# Profils : couverture complète + sélecteur à la création

## 1. Backfill des 42 conférenciers archivés
Rejouer la même règle d'auto-attribution (mots-clés sur `role`/`biography`/`themes`, fallback `Chefs d'entreprise`) sur les fiches `archived = true` qui n'ont pas encore de `profile_id`. Garantit que les 246 fiches ont un profil.

## 2. Sélecteur profil au formulaire de création (`AdminSpeakersCRM`)
- Charger la liste des profils (`speaker_profiles`) au montage.
- Ajouter un champ `profile_id` au state `manualForm` (initial : `null`).
- Ajouter un `<select>` "Profil" dans le formulaire de création manuelle, juste après "Genre".
- Inclure `profile_id` dans le payload `INSERT speakers`.
- Réinitialiser le champ après création.

## 3. Sous-onglet "Profils" : voir aussi les archivés
Petit toggle "Inclure les archivés" (off par défaut) dans `AdminSpeakerProfiles.tsx` pour que tu puisses retravailler le profil des fiches hors ligne. Les archivés sont visuellement marqués (badge gris).

## Hors scope
- Champ profil dans le dialog d'édition d'une fiche existante (déjà éditable via le sous-onglet "Profils", inutile de dupliquer).
