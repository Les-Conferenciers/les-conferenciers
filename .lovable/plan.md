# Nettoyage email facture

## 1. Supprimer l'aperçu du mail (Factures)
`src/components/admin/EventDossier.tsx` lignes 3563-3571 : retirer le bloc `<Label>Aperçu du mail</Label>` + aperçu `whitespace-pre-wrap` + note bouton automatique. La textarea « Corps du mail » au-dessus reste, elle suffit.

## 2. Supprimer le bloc coordonnées bancaires dans le mail envoyé
`supabase/functions/send-invoice-email/index.ts` lignes 107-111 : retirer entièrement la `<div>` qui affiche IBAN + BIC. L'IBAN reste affiché sur la facture PDF elle-même (InvoiceView), donc le client garde l'info via le lien « Consulter la facture ».

Aucun autre changement, pas de migration.
