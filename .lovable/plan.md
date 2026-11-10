# Nouveau RIB + copie cachée Pennylane sur les factures

## 1. Nouveau RIB sur toutes les factures
Remplacer les coordonnées bancaires affichées sur les factures (en ligne, PDF, renvois) :
- IBAN : FR76 1732 8844 0034 5146 9068 617
- BIC : SWNBFR22
- Banque : SWAN SAS (Paris) — titulaire : EVE

Les factures déjà envoyées afficheront aussi le nouveau RIB quand le client rouvre son lien.

## 2. Copie cachée automatique vers Pennylane
- Chaque envoi ou renvoi de facture part aussi en copie cachée à eve-v5pdlydq@customers.pennylane.com.
- Invisible pour le client (pas dans « À », ni « CC », ni dans le contenu du mail).
- Dans l'admin, une petite mention discrète dans la fenêtre d'envoi : « Copie cachée automatique : Pennylane (eve-v5pdlydq@…) ».
- L'adresse n'apparaît pas dans l'historique d'envoi visible des destinataires.

## Détails techniques
- `src/lib/companyConfig.ts` : iban/bic (+ nom de banque si affiché) mis à jour.
- `supabase/functions/send-invoice-email` : ajout `bcc: [PENNYLANE_BCC]` dans l'appel Resend, côté serveur uniquement ; non stocké dans `email_cc`/`cc_emails`.
- Mention info dans la modale d'envoi/renvoi de facture.
- Mise à jour de la mémoire « Agency Configuration ».
