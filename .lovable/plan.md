# Cohérence du sélecteur de statut contrat : « Signé » → « Archivé »

## Objectif
Aligner le choix manuel de statut dans la fiche dossier avec les sous-onglets de l'onglet Contrats (En cours / En attente de paiement / Archivés).

## Modification
Dans `src/components/admin/EventDossier.tsx` (bloc « Contrat client », ~lignes 2150-2194) :

1. **Sélecteur manuel** : renommer l'option `<SelectItem value="signed">Signé</SelectItem>` en **« Archivé »** (la valeur technique `signed` en base ne change pas — aucune migration nécessaire).
2. **Badge de statut** : remplacer le libellé `✓ Signé par …` par **« ✓ Archivé (signé par …) »** pour rester cohérent tout en conservant l'information du signataire.
3. Textes liés mis à jour si nécessaire (confirmations d'avenant mentionnant « signé » restent factuels et inchangés).

## Technique
- Aucun changement de schéma : la colonne `contracts.status` garde la valeur `signed`.
- Aucun autre écran n'a de sélecteur manuel équivalent (vérifié dans `ContractView.tsx`).
