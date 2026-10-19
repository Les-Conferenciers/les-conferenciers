# Factures (fiche contrat) : bon destinataire + bouton Renvoyer

## Constat
- Dans la fiche contrat, la fenêtre « Envoyer la facture » préremplit toujours l'adresse de la cliente, même quand une entité à facturer est renseignée. Le gestionnaire de factures, lui, propose bien l'entité.
- Pour BDC 1026 (solde 20261016-1026-S, Kactus Agency), l'adresse proposée était donc lucie.lebaron@safrangroup.com. L'historique en base montre un envoi à mareva.huchet@kactus.com à 10h22 : l'adresse a probablement été corrigée à la main pour cet envoi. Je le vérifierai avec vous.
- Dans la fiche contrat, le bouton « Envoyer » disparaît après l'envoi : impossible de renvoyer la facture.

## Ce qui change (fiche contrat)
1. **Bon destinataire par défaut** : dans cet ordre, les adresses déjà utilisées pour cette facture, sinon celles de l'acompte du dossier, sinon le mail de l'entité à facturer, sinon le mail du client. C'est la même règle que dans le gestionnaire de factures.
2. **Bouton « Renvoyer »** sur toute facture envoyée ou payée. Il rouvre la fenêtre d'envoi préremplie avec les derniers destinataires.
3. **Fenêtre d'envoi alignée sur le gestionnaire** : adresses en pastilles pour « À » et « CC », plusieurs adresses possibles. Une adresse invalide bloque l'envoi.
4. **Historique visible sous la facture** : « Envoyée le JJ/MM à … », pour voir tout de suite à qui elle est partie.
5. Un renvoi ne change pas le statut d'une facture déjà payée.

## Détails techniques
- `EventDossier.tsx` : `openInvoiceEmail` utilise la même cascade de destinataires que `ContractInvoiceManager.tsx` (email_to → acompte.email_to → billing_entity_email → client_email). Utilisation de `EmailChipsInput` pour À et CC, et envoi de `cc` à la fonction. Bouton « Renvoyer » pour les factures `sent` et `paid`. Suppression de l'update local du statut (la fonction le gère déjà et garde « paid »). Ligne d'historique lue dans `invoice_email_logs`.
- Aucun changement côté serveur.
