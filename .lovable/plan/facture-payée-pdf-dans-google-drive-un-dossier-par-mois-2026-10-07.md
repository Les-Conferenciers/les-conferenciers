# Facture payée -> PDF dans Google Drive (un dossier par mois)

## Ce que vous verrez
- Quand vous cliquez « Marquer payée » sur une facture, son PDF est envoyé automatiquement dans votre Google Drive.
- Rangement : un dossier principal (ex. « Factures payées »), puis un sous-dossier par mois, ex. « 2026-10 ». Le sous-dossier est créé s'il n'existe pas.
- Nom du fichier : numéro de facture + client, ex. `2026-10-1029 - Davido Consulting.pdf`.
- Sous la facture : « Envoyée sur Drive le JJ/MM » avec un lien vers le fichier, ou une alerte rouge et un bouton « Réessayer » si l'envoi a échoué.
- Le mois utilisé est celui du paiement (date « payée le »).

## Étapes
1. Connecter votre compte Google Drive (une carte de connexion apparaîtra dans le chat).
2. Vous m'indiquez le dossier principal (lien Drive) — sinon je crée « Factures payées » à la racine.
3. Générer le PDF de la facture (même rendu que l'écran facture actuel, 1 page A4) au moment du marquage « payée ».
4. Envoi dans Drive via une fonction serveur, avec trace du résultat sur la facture.
5. Test sur une facture de test.

## Détails techniques
- PDF généré côté navigateur avec html2canvas + jsPDF (déjà installés, utilisés dans ContractSign) à partir du rendu de `InvoiceView` chargé hors écran, dans le handler de `ContractInvoiceManager.tsx` (ligne ~738).
- Nouvelle edge function `upload-invoice-drive` : vérifie l'admin, reçoit le PDF en base64, cherche/crée le sous-dossier `YYYY-MM` (`files?q=name=... and '<parent>' in parents and mimeType=folder`), upload multipart via le connecteur Google Drive.
- Migration : colonnes `invoices.drive_file_id`, `drive_file_url`, `drive_uploaded_at`, `drive_error`.
- Dossier parent stocké comme secret/config `GOOGLE_DRIVE_INVOICES_FOLDER_ID`.
- Les factures déjà payées ne sont pas envoyées rétroactivement (possible en option ensuite).
