# Article 5.1 written out in full instead of « {{PRICE_CLAUSE}} »

## What changes
- In the editor for article 5, « {{PRICE_CLAUSE}} » is replaced by the actual text, which you can edit contract by contract:
  **5.1 Prix de la Prestation.** Le montant de la Prestation est détaillé au Bon de commande. Le Client s'engage à verser 50% du montant total dans les 30 jours suivants la signature. 100% du montant devra être reçu au plus tard sept jours avant la tenue de l'Événement.
- This becomes the default text on every new contract.
- Contracts whose article 5 was already customised and still contain « {{PRICE_CLAUSE}} »:
  - the client sees the text in full, as today;
  - when you open the editor, the variable is shown already replaced by the text.
- The « Astuce {{PRICE_CLAUSE}} » help notes are removed from the contract editor and from the event file.
- Signed contracts don't change.

## Point to know
Until now, ticking « sans acompte » automatically turned 5.1 into « 100% au plus tard sept jours avant ». From now on, the text stays as it is: for a contract with no deposit, you edit 5.1 by hand in that contract.

## Technical details
- `src/lib/contractClauses.ts`: hard-coded art5 `defaultHtml` (number 5.1).
- `getClauseHtml` keeps replacing `{{PRICE_CLAUSE}}` for old overrides.
- Article editors (`EventDossier.tsx`, `ContractInvoiceManager.tsx`): when loading the value, `{{PRICE_CLAUSE}}` is replaced by the standard text; tips are removed.
- `ContractClauses.tsx`: no change to the display logic, apart from the fallback.
