
## 1. Nouveau format de numéro de facture

Format actuel : `DDMM-BDC` (ex. `0525-01`)
Nouveau format : `YYYYMMDD-BDC` (ex. `20270516-1020`)

**Migration SQL** — remplacer la fonction `generate_invoice_number(_proposal_id)` :
- Si date d'événement + BDC existent → `to_char(event_date, 'YYYYMMDD') || '-' || bdc_clean`
- Fallback inchangé (`YYYYMMDD-XX`)
- `bdc_clean` retire toujours le préfixe `BDC-`

Les factures déjà créées **gardent leur ancien numéro** (on ne renumérote pas l'historique pour ne pas casser les références déjà envoyées au client).

## 2. Mentions dans la facture (`src/pages/InvoiceView.tsx`)

- Ligne 146 : `Mention à rappeler impérativement : Bon de commande n° {bdcNumber}`  
  → `Mention à rappeler impérativement : {nom client} - BDC-{numéro}`
- Ligne 218 : `… référence à rappeler : BDC n° {bdcNumber}`  
  → `… référence à rappeler : {nom client} - BDC-{numéro}`

`{nom client}` = `client.company_name` (fallback `proposal.client_name`).  
`{numéro}` = BDC nettoyé (sans le préfixe `BDC-`, qu'on remet une seule fois).

## 3. Nom du fichier PDF à l'impression

Dans `InvoiceView.tsx`, juste avant `window.print()` : changer `document.title` en `Facture – {nom client} – BDC-{numéro}` puis le restaurer après. Le navigateur utilisera ce titre comme nom de fichier par défaut dans la boîte « Enregistrer en PDF ».

## 4. Champ « Notes internes » à la création de facture (`EventDossier.tsx`)

Dans le dialogue « Créer une facture » (autour de la ligne 3410) :
- Ajouter un `<Textarea>` « Notes internes (non visibles sur la facture) »
- Nouveau state `invoiceNotes`
- Passer `notes: invoiceNotes || null` dans `supabase.from("invoices").insert(...)` (ligne 1439)
- Reset après création

La colonne `notes` existe déjà sur la table `invoices`. Les notes ne s'affichent pas sur la facture publique (le bloc Notes actuel dans `InvoiceView.tsx` sera retiré pour garantir la confidentialité côté client).

## 5. UX du bouton « Marquer comme payée »

Aujourd'hui : bouton vert plein avec libellé `Payée` → ambigu (on dirait un statut).

Nouveau :
- Statut `sent` (en attente) : bouton **outline neutre** avec libellé explicite « **Marquer comme payée** » + icône `CheckCircle`. Pas de fond vert.
- Statut `paid` : badge vert inchangé (`Payée le …`) + petit bouton fantôme « Annuler » conservé.

Couleur verte réservée au **statut** final, pas au bouton d'action.

---

## Détails techniques

- Migration : `CREATE OR REPLACE FUNCTION public.generate_invoice_number(_proposal_id uuid)` — pas de changement de signature, pas d'impact sur le trigger `set_invoice_number`.
- `bdcNumber` dans `InvoiceView.tsx` peut arriver avec ou sans préfixe `BDC-` → normaliser : `const bdcClean = bdcNumber.replace(/^BDC[- ]*/i, "")` puis afficher `BDC-{bdcClean}`.
- Fichier PDF : pas d'API standard pour forcer le filename à l'impression, mais `document.title` est la convention respectée par Chrome / Edge / Safari.
- Aucun changement de schéma (la colonne `notes` est déjà présente).
