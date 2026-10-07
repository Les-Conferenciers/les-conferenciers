# Feuille de liaison : aperçu incomplet et modifications non enregistrées

## Cause (vérifiée)
Le dossier AMER MYRIAM SASU a 2 versions de contrat (v1 remplacée, v2 active). La page d'aperçu cherche « le » contrat du dossier en s'attendant à un seul : avec deux versions, elle n'en trouve aucun. Résultat : date, lieu et horaires vides, et l'enregistrement depuis l'aperçu ignore ces 3 champs. Les données sont pourtant bien en base (17/11/2026, CRIGEN Stains, 13h à 14h).

Tous les dossiers ayant eu un « annule et remplace » sont touchés.

## Corrections
1. Aperçu : charger uniquement la version active du contrat (non remplacée, la plus récente) → date, lieu, horaires s'affichent.
2. Enregistrement depuis l'aperçu : mettre à jour seulement le contrat actif (pas les anciennes versions).
3. Bouton « Enregistrer les modifications » de la fenêtre du dossier : vérifier les erreurs de sauvegarde et afficher un message d'erreur clair au lieu d'un faux « enregistré ».
4. Vérifier sur AMER MYRIAM : aperçu complet, puis modification + enregistrement relus correctement.

## Détails techniques
- `src/pages/LiaisonSheetView.tsx` : requête contracts avec `.is("superseded_at", null).order("created_at",{ascending:false}).limit(1).maybeSingle()`, stocker `contract.id`, update par `.eq("id", contract.id)`.
- `EventDossier.tsx` `persistLiaisonFields` : récupérer `error` des deux updates, les remonter ; toast d'erreur si échec (dans le bouton et l'aperçu).
