# Suppression de contrats dans la vue Archivés

## Ce qui existe déjà
Un bouton de suppression (`Trash2`) avec dialogue de confirmation existe dans `AdminEventDossiers.tsx` : il supprime en base les factures, le dossier événement, le contrat, les tâches, les liens conférenciers puis la proposition. Le message d'avertissement irréversible est déjà en place. Mais ce bouton est **masqué dès que le dossier est archivé** (condition `!r.isArchived`).

## Changements prévus

### 1. Afficher le bouton Supprimer dans la vue Archivés
Dans `src/components/admin/AdminEventDossiers.tsx` :
- Sortir le bouton « Supprimer » de la condition `!r.isArchived` pour qu'il soit visible aussi sur les dossiers archivés (signés, gagnés, perdus).
- Le bouton « Marquer comme perdu » reste masqué sur les archivés (pas de sens), de même que « Restaurer » reste limité aux perdus.

### 2. Renforcer le message d'avertissement
Adapter le texte du dialogue de confirmation :
- « ⚠️ Attention : cette action est **irréversible**. Tout sera supprimé en base : la proposition, le contrat, les factures, le dossier événement et toutes les données associées. »

## Détails techniques
- Fichier unique modifié : `src/components/admin/AdminEventDossiers.tsx`.
- `handleDelete` supprime déjà en cascade toutes les tables liées (invoices, events, contracts, proposal_tasks, proposal_speakers, proposals) — aucun changement de logique de suppression.
- Vérification du build après modification.
