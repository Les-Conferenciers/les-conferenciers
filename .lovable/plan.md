## Objectif
1. Permettre de changer le type (Acompte 50% / Solde 50% / Total 100%) depuis le dialogue **« Modifier »** d'une facture.
2. Faire dépendre l'étape **« Acompte client »** du pipeline de la présence (ou non) d'une facture de type `acompte`, et plus du flag `deposit_required` du contrat.

## 1. Dialogue Modifier — ajout du sélecteur de type

Fichiers : `src/components/admin/ContractInvoiceManager.tsx` et `src/components/admin/EventDossier.tsx`

- Ajouter un state `editInvoiceType` initialisé depuis `inv.invoice_type` dans `openEditInvoice`.
- Insérer en tête du dialogue (au-dessus du Montant HT) le même bloc 3 boutons que la création :
  - Acompte 50% / Solde 50% / Total 100%.
- Inclure `invoice_type: editInvoiceType` dans le `update` de `handleSaveInvoice`.
- Conserver le calcul libre du montant : changer le type ne recalcule **pas** automatiquement le HT (l'utilisateur ajuste si besoin) — sinon on écraserait une facture déjà émise.

## 2. Pipeline — étape Acompte client conditionnée par le type

Fichier : `src/components/admin/AdminEventDossiers.tsx` (ligne ~370).

Remplacer :
```ts
const depositRequired = pContract?.deposit_required !== false;
```
par :
```ts
const hasAcompteInvoice = pInvoices.some((i) => i.invoice_type === "acompte");
```
et utiliser `hasAcompteInvoice` à la place de `depositRequired` pour insérer (ou non) l'étape `client_deposit` dans le tableau `stages`.

Effet : si une facture est en type `acompte` → l'étape « Acompte client reçu » apparaît. Si on bascule la facture en `solde` ou `total` via le dialogue Modifier → l'étape disparaît automatiquement (et réapparaît si on rebascule en `acompte`).

Le compteur du bandeau de filtres (`{ key: "client_deposit", … count: count("client_deposit") }`) reste valide : il ne comptera que les dossiers où l'étape a été insérée.

## Hors périmètre
- Le toggle « Acompte client requis (50%) » du dialogue **création de contrat** reste tel quel : il pilote uniquement la clause de prix du contrat (50/50 vs 100%), pas le pipeline.
- Pas de migration de données : le champ `invoice_type` existe déjà sur `invoices`.
