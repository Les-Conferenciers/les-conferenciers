# Réactivation d'un dossier archivé

## État actuel (vérifié)

L'archivage n'est pas un statut stocké : il est **calculé** dans `AdminEventDossiers.tsx` à partir de 3 cas :

1. **Perdu** : la proposition a `lost_at` renseigné → un bouton « ↩️ Restaurer » existe déjà (efface `lost_at`).
2. **Signé** : le contrat a le statut `signed` → modifiable uniquement en ouvrant le dossier (sélecteur manuel), pas depuis la liste.
3. **Gagné** : toutes les factures sont payées ET le conférencier est payé (`speaker_paid_at`) → aucun moyen de revenir en arrière.

## Ce qui sera ajouté

Un bouton **« ↩️ Réactiver »** sur chaque ligne de l'onglet **Archivés**, avec une boîte de confirmation adaptée au cas :

- **Dossier perdu** → efface la marque « perdu » (comportement existant, conservé).
- **Contrat archivé (signé)** → repasse le contrat en « En attente de paiement » s'il reste des factures envoyées non payées, sinon en « En cours ».
- **Dossier gagné** (tout payé) → la confirmation avertit que la date « Conférencier payé » sera effacée pour que le dossier redevienne actif ; le contrat repasse en « En attente de paiement ».

Le dossier réactivé réapparaît immédiatement dans l'onglet « En cours » ou « En attente de paiement » selon le cas. Aucune donnée (contrat, factures, événement) n'est supprimée.

## Détails techniques

- Fichier modifié : `src/components/admin/AdminEventDossiers.tsx` uniquement.
- Nouvelle fonction `handleReactivate(row)` : selon le cas, met à jour `proposals.lost_at/lost_reason`, `contracts.status`, et/ou `events.speaker_paid_at`, puis rafraîchit la liste.
- Boîte de confirmation (`Dialog`) avec message spécifique par cas, notamment l'avertissement sur l'effacement de « Conférencier payé » pour les dossiers gagnés.
- Aucune migration base de données, aucun changement de schéma.
