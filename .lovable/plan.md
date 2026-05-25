## Diagnostic

Les factures Davido ont reçu `20260525-01` et `20260525-02` (date du jour + compteur) parce que la fonction `generate_invoice_number` lit `events.event_date`, qui est `NULL` pour ces dossiers. La vraie date est stockée sur `contracts.event_date` (13 avril 2027 et 16 mai 2027). La fonction n'a donc pas trouvé de date et est tombée dans le fallback.

## 1. Corriger la fonction SQL

Mettre à jour `public.generate_invoice_number(_proposal_id uuid)` :

- Récupérer `bdc_number` depuis `events` (inchangé).
- Récupérer la date avec ce priorité : `events.event_date` → sinon `contracts.event_date` la plus récente.
- Si date + BDC trouvés → `to_char(date, 'YYYYMMDD') || '-' || bdc_clean`.
- Sinon fallback inchangé (`YYYYMMDD-NN`).

## 2. Renuméroter les 2 factures Davido existantes

Mettre à jour manuellement les 2 factures déjà créées avec le fallback :

- `20260525-02` (Davido, BDC-1019, événement 13/04/2027) → **`20270413-1019`**
- `20260525-01` (Davido Mai, BDC-1020, événement 16/05/2027) → **`20270516-1020`**

Les autres factures historiques (`FAC-2026-XXX`) restent inchangées.

## 3. Aucun changement côté front

Le composant `InvoiceView.tsx` affiche simplement `invoice_number`, donc rien à modifier.
