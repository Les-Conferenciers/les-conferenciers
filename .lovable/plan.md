# Suppression du filtre Gagnés/Perdus dans l'onglet Archivés

## Objectif

Dans l'onglet Contrats > Archivés, supprimer le sous-filtre Gagnés/Perdus/Signés. L'onglet Archivés affiche désormais l'ensemble des dossiers signés, gagnés et perdus sans possibilité de filtrage interne.

## Résultat attendu

- 3 sous-onglets restants : **En cours**, **En attente de paiement**, **Archivés**.
- Dans « Archivés », plus de déroulant de filtre Gagnés/Perdus/Signés.
- Les compteurs internes `gagnes`, `perdus`, `signes` et la logique `archiveStatus` sont supprimés.
- Le filtre par année reste visible et fonctionnel sur tous les onglets.
- Les dossiers perdus conservent leur badge ❌ Perdu et le bouton d'action associé reste présent si nécessaire.

## Détail technique

**`src/components/admin/AdminEventDossiers.tsx`**
- Supprimer l'état `archiveFilter` et son type.
- Supprimer le calcul de `archiveStatus` (`gagne` / `perdu`) dans l'enrichissement des lignes.
- Simplifier le filtrage de l'onglet Archivés : garder uniquement `r.isArchived || r.contractStatus === "signed"`.
- Supprimer les compteurs `gagnes`, `perdus`, `signes`.
- Supprimer le bloc `Select` affichant les options Signés / Gagnés / Perdus dans l'onglet Archivés.
- Conserver le badge ❌ Perdu sur les lignes concernées et le bouton d'action « Marquer comme perdu » dans les autres onglets.
- Conserver le filtre par année (`yearFilter`) et son `Select`.

Aucune migration base de données n'est nécessaire.
