# Libellé « Frais VHR » sur les factures

## Objectif
Sur les factures, la ligne « Estimation frais VHR » devient « Frais VHR », et le sous-titre « Voyage / Hébergement / Restauration — refacturés au réel sur justificatifs » est supprimé.

## Changement
- `src/pages/InvoiceView.tsx` (lignes 321-322) :
  - Titre : `Estimation frais VHR` → `Frais VHR`
  - Suppression du sous-titre gris sous la ligne.

## Impact
- S'applique à toutes les factures affichées (acompte, solde, totale), côté admin et côté lien client public — c'est le même écran.
- Aucune donnée en base n'est modifiée : c'est uniquement le texte affiché.
