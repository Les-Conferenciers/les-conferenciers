# Envoyer la facture en PDF à Pennylane

## Le problème
Pennylane reçoit aujourd'hui une copie cachée du mail client. Ce mail ne contient qu'un bouton « Consulter la facture », sans pièce jointe. Pennylane transforme donc le mail lui-même en document (d'où la facture « 0,00 € À compléter » de la capture).

## Ce qui change
- Au moment d'envoyer une facture (premier envoi ou renvoi après correction), l'admin génère le PDF de la facture, avec le même rendu que celui déjà utilisé pour l'archivage Drive.
- Le client reçoit **le même mail qu'aujourd'hui**, sans changement.
- La copie cachée à Pennylane est remplacée par **un mail séparé, envoyé à Pennylane uniquement**, avec la facture en PDF jointe (nom du fichier : `Facture-<numéro>.pdf`). L'adresse Pennylane reste invisible pour le client.
- Si le PDF ne peut pas être généré, le mail client part quand même et un message vous prévient que Pennylane ne l'a pas reçue.

## Détails techniques
- Front (`ContractInvoiceManager.tsx` et le renvoi dans le dossier événement) : appel de `renderInvoicePdfBase64(token)` (`src/lib/invoicePdf.ts`) avant `send-invoice-email`, puis envoi de `pdf_base64` dans le body.
- `send-invoice-email` : suppression du `bcc` ; après l'envoi client réussi, second appel Resend vers `eve-v5pdlydq@customers.pennylane.com` avec `attachments: [{ filename, content: pdf_base64 }]` et un court texte. Réponse enrichie d'un indicateur `pennylane_sent`. Redéploiement de la fonction.
- Mise à jour de la mémoire « Agency Configuration » (PDF joint au lieu du bcc).
