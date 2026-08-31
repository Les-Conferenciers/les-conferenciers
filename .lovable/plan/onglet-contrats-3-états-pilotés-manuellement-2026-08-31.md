# Onglet Contrats : 3 états pilotés manuellement

## Pourquoi MEDEF Yonne apparaît dans « En cours »

Les sous-onglets de l'onglet Contrats ne regardent pas du tout le statut du contrat. Ils sont recalculés à la volée à partir des factures et des dates de paiement :

- « En attente de paiement » = une facture solde/total envoyée et non payée
- « Archivés » = toutes les factures payées + conférencier payé (gagné), ou dossier perdu
- « En cours » = tout le reste

Pour MEDEF Yonne, le contrat est bien en statut « Archivé », mais sa facture « total » est encore au statut envoyée (non payée) et la date d'envoi facture côté dossier est vide : le calcul le range donc dans « En cours ». Le statut que tu choisis à la main n'a aucun effet sur le classement.

## Ce qu'on met en place

Le statut du contrat devient la seule source de vérité, avec 3 états :

1. **En cours** (fusionne l'ancien « brouillon » et « envoyé »)
2. **En attente de paiement**
3. **Signé**

Le changement d'état devient 100 % manuel : plus aucune bascule automatique, y compris lors de la signature en ligne par le client (la date de signature est toujours enregistrée, mais l'état reste celui que tu as choisi).

L'onglet « Archivés » est conservé comme vue séparée (dossiers gagnés / perdus, calculée comme aujourd'hui), il ne fait plus partie des états du contrat.

### Reprise de l'existant

- Contrats « brouillon » ou « envoyé » → **En cours**
- Contrats « archivé » → **Signé**

## Détail technique

**Base de données (mise à jour de données)**
- `contracts.status` : `draft` et `sent` → `en_cours` ; `archived` → `signed`. `en_attente_paiement` et `signed` inchangés.

**`src/components/admin/AdminEventDossiers.tsx`**
- Les sous-onglets « En cours » / « En attente de paiement » filtrent désormais sur `contract.status` (`en_cours`, `en_attente_paiement`) au lieu du calcul factures. Ajout d'un onglet « Signé ».
- Onglet « Archivés » conservé tel quel (gagné/perdu), les dossiers archivés restant exclus des 3 premiers onglets.
- Compteurs alignés sur la même logique.
- Les dossiers sans contrat créé sont comptés dans « En cours ».

**`src/components/admin/EventDossier.tsx`**
- Le sélecteur de statut ne propose plus que les 3 valeurs.
- Suppression de la bascule automatique vers `en_attente_paiement` lors de l'envoi d'une facture solde/total.
- Suppression du passage automatique à `sent` lors de l'envoi du contrat (seul `contract_sent_at` est enregistré).
- Badges de statut mis à jour (3 libellés + tolérance des anciennes valeurs éventuelles).

**`src/components/admin/ContractInvoiceManager.tsx` et `src/pages/ContractView.tsx`**
- Mêmes libellés/statuts, plus de mise à jour automatique du statut contrat.

**`supabase/functions/send-contract-email/index.ts`**
- Ne met plus `status: "sent"` ; enregistre uniquement `contract_sent_at`. Redéploiement de la fonction.

**`src/pages/ContractSign.tsx`**
- La signature client enregistre `signed_at`, `signer_name`, `client_signed_received_at` mais ne change plus `status`.
