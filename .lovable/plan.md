
# Plan — 10 améliorations CRM (contrats / propositions / factures)

## 1. Système de relance — refonte complète

**Objectif** : remplacer les tâches J+7 / J+14 auto par UNE date de relance manuelle + une 2e date "rappel agenda" qui apparaît après la 2e relance effectuée. Notes conservées.

- DB : ajouter `proposals.next_reminder_date` (date) et `proposals.next_reminder_note` (text). Ajouter `proposals.followup_reminder_date` + `followup_reminder_note` (le 2e champ, rappel agenda après 2e relance). Conserver `reminder1_sent_at` / `reminder2_sent_at` pour la logique "combien de relances ont été envoyées".
- Code : supprimer du UI le bloc "Tâches de relance" dans `AdminProposals.tsx` (onglet Relances de l'agenda) + le générateur auto J+7/J+14 dans `send-proposal-reminder` / `send-proposal-email`. Conserver `proposal_tasks` en table mais ne plus l'alimenter automatiquement (pas de DROP pour ne pas casser l'historique).
- UI nouvelle (dans la carte proposition, AdminProposals + EventDossier) :
  - Champ unique "📅 Prochaine relance prévue" (date picker) + petit éditeur Notes (réutiliser SimpleRichTextEditor) — visible toujours.
  - Bouton "Marquer relance envoyée" → set `reminder1_sent_at` ou `reminder2_sent_at` selon le compteur, vide `next_reminder_date`.
  - Après que `reminder2_sent_at` soit rempli, faire apparaître un 2e bloc "🔔 Rappel agenda" (date + notes), aucun mail envoyé, sert juste d'alerte interne.
- Agenda quotidien (`daily-task-recap`) : remplacer la requête `proposal_tasks` par `proposals` filtrés sur `next_reminder_date <= today` OR `followup_reminder_date <= today` (active uniquement, non perdue/acceptée). Conserver le format de mail récap 9h pour Nelly.

## 2. Fix erreur "Créer la version V2" — BDC-1034 Davido Consulting

**Cause identifiée** : la table `contracts` a une contrainte `UNIQUE (proposal_id)`. Quand on tente d'insérer la v2 avec le même `proposal_id`, Postgres rejette.

- Migration : `DROP CONSTRAINT contracts_proposal_id_key`, remplacer par un index unique partiel : `CREATE UNIQUE INDEX contracts_active_proposal_idx ON contracts(proposal_id) WHERE superseded_at IS NULL;` — garantit qu'il n'y a jamais 2 contrats actifs pour la même proposition, mais autorise N versions historiques.
- Vérifier que le flow `handleSaveContract` (EventDossier.tsx L815-843) fonctionne ensuite : insert v2 puis update v1 avec `superseded_at` + `superseded_by_contract_id`.

## 3. Email contrat conférencier — afficher détails événement

- Dans la composition de l'email envoyé au conférencier (recherche du template dans `EventDossier.tsx` autour de L1040-1098 et `send-contract-email`), retirer la mention "Dress code" et ajouter les détails si renseignés : `event_format`, `event_time`, `event_description`, `audience_size`. Ne rien afficher si vide (pas de "à définir").

## 4. Brouillon email du contrat (comme proposition)

- Champs `email_subject` et `email_body` existent déjà sur `contracts`. Dans le dialogue d'envoi du contrat (EventDossier.tsx L887+), ajouter bouton "Enregistrer le brouillon" (update sans envoyer) en plus de "Envoyer". Au rouvrir, recharger les valeurs persistées.

## 5. Emails en CC modifiables après envoi proposition (brouillon)

- DB : ajouter `proposals.cc_emails` (text[]) — déjà présent sur certaines tables, à vérifier.
- UI : dans la card proposition (statut `sent`), permettre d'éditer la liste de CC (chips) tant que la proposition n'est pas `accepted`. Les CC sont utilisés à la prochaine relance/renvoi.

## 6. Notes internes sur la facture

- DB : `invoices.notes` existe déjà (text). 
- UI : dans `ContractInvoiceManager.tsx`, ajouter sous chaque facture une zone "Note interne" avec `SimpleRichTextEditor` (mini éditeur identique à celui des relances), auto-save à la perte de focus.

## 7. Bascule auto contrat → "en attente de paiement"

- Logique dans `send-invoice-email` (ou côté client après invoke OK) : si `invoice_type` ∈ {`solde`, `total`} et envoi réussi → `UPDATE contracts SET status = 'en_attente_paiement' WHERE id = ?`. Si `acompte` → ne pas changer le statut (reste `signed`/`en cours`).
- Ajouter `'en_attente_paiement'` aux statuts gérés dans le pipeline (`AdminEventDossiers.tsx`) et son badge couleur.

## 8. Rappel agenda J+60 si toujours en attente de paiement

- À la bascule item 7, calculer `next_reminder_date = today + 60j` et l'écrire sur `proposals.next_reminder_date` (réutilise le système item 1) avec note auto "Relancer paiement facture {invoice_number} BDC {bdc}".
- Si la facture passe à `paid` entretemps → effacer `next_reminder_date` si la note matche le pattern paiement.

## 9. Pièces jointes sur l'email du contrat

- Dialogue d'envoi du contrat : ajouter zone "Pièces jointes" (input file multi). Upload dans le bucket existant `signed-contracts` (ou créer `contract-attachments`), passer les URLs/Base64 à `send-contract-email`.
- `send-contract-email` (Resend) : accepter un tableau `attachments` et le relayer à l'API Resend (`attachments: [{ filename, content }]`).
- Limite taille raisonnable (10 Mo total) avec toast d'erreur.

## 10. Lignes "Frais de déplacement" et "Autre" visibles

- `ContractView.tsx` (L353) : la boucle `contract_lines` n'affiche déjà que la ligne speaker pleinement, vérifier que `travel` et `custom` apparaissent en lignes distinctes avec leur label et montant HT/TTC (actuellement le `line.label` est rendu mais à confirmer visuellement).
- `InvoiceView.tsx` (L94 commentaire "Single designation line: prestation totale (cachet + commission + déplacement fusionnés)") : c'est le bug. Détacher les lignes `travel` et `custom` du calcul fusionné et les rendre comme lignes de tableau séparées (designation = label de la ligne, montant HT, TVA, TTC). La ligne speaker reste fusionnée cachet+commission.

---

## Section technique (détails)

### Migration SQL (items 1, 2, 5)

```sql
-- Item 2 : fix V2
ALTER TABLE public.contracts DROP CONSTRAINT contracts_proposal_id_key;
CREATE UNIQUE INDEX contracts_active_proposal_idx
  ON public.contracts(proposal_id) WHERE superseded_at IS NULL;

-- Item 1 : nouvelles colonnes relance
ALTER TABLE public.proposals
  ADD COLUMN next_reminder_date date,
  ADD COLUMN next_reminder_note text,
  ADD COLUMN followup_reminder_date date,
  ADD COLUMN followup_reminder_note text;

-- Item 5 : CC
ALTER TABLE public.proposals ADD COLUMN cc_emails text[] DEFAULT '{}';
```

### Fichiers principalement touchés

- `src/components/admin/EventDossier.tsx` (items 2, 3, 4, 9, 10)
- `src/components/admin/ContractInvoiceManager.tsx` (items 6, 7, 10)
- `src/components/admin/AdminEventDossiers.tsx` (item 7 — pipeline badge en_attente_paiement)
- `src/pages/AdminProposals.tsx` (items 1, 5)
- `src/pages/ContractView.tsx`, `src/pages/InvoiceView.tsx` (item 10)
- `supabase/functions/send-contract-email/index.ts` (items 3, 9)
- `supabase/functions/send-invoice-email/index.ts` (items 7, 8)
- `supabase/functions/daily-task-recap/index.ts` (item 1)
- `supabase/functions/send-proposal-reminder/index.ts` (item 1 — retirer génération auto tâches)

### Ordre d'implémentation suggéré

1. Migration SQL (items 1+2+5) — débloque tout le reste.
2. Item 2 (fix V2) — petit, validable immédiatement sur BDC-1034.
3. Item 10 (lignes frais visibles) — isolé, rapide.
4. Item 1 (refonte relances) — gros chantier UI.
5. Items 6, 7, 8 (notes facture + bascule paiement + J+60) — chaînés.
6. Items 3, 4, 9 (emails contrat) — chaînés sur le même dialogue.
7. Item 5 (CC modifiables) — finition.
