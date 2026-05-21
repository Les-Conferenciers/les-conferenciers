## Plan d'évolutions Propositions (8 points)

### 1. Préremplissage complet quand on choisit un client existant
Aujourd'hui, dans le dialog « + Nouvelle proposition », `selectExistingClient` (≈ ligne 1401 de `src/pages/Admin.tsx`) ne pré-remplit que société / email / contact / téléphone. Les détails événement ne se remplissent que via un lead matché par email.

À faire dans `selectExistingClient` :
- Récupérer la **dernière proposition** de ce `client_id` (`proposals` triée par `created_at desc`, limit 1).
- Si trouvée, pré-remplir `eventLocation`, `eventDateText`, `audienceSize` (sans écraser une saisie déjà présente).
- Formater `eventDateText` au format français `jj mois aaaa` (via `formatFrenchEventDate`) avant de l'injecter dans le champ.
- Re-générer le sujet et le corps du mail (`getDefaultEmailSubject`, `getDefaultEmailBody`) avec ces nouvelles valeurs, en utilisant le `recipientName` du client.
- Garder en parallèle l'autofill existant par leads (email) en fallback si pas de proposition précédente.

### 2. Remettre la phrase de contexte événement dans le mail « classique »
`getDefaultEmailBody` / `getFollowUpEmailBody` reçoivent un `eventContext` mais il n'est plus passé à l'ouverture du dialog ni dans `handleNewProposalForClient`.
- Construire `eventContext = buildEventContextLine(eventLocation, eventDateText, audienceSize)` quand on appelle `setEmailBody(...)` / `setEditEmailBody(...)`, et le passer en 3e argument.
- Quand l'admin modifie un des 3 champs événement, re-générer le corps **uniquement si** le corps actuel correspond au template (sinon respecter la perso manuelle).
- Idem pour la prévisualisation : utiliser les valeurs courantes du formulaire.

### 3. Une seule zone de notes (sous Relance 1)
Dialog « Tâches de relance » (≈ ligne 2543) :
- Masquer le bloc `Note` pour `task.task_type === "relance_2"`.
- Sous Relance 1, libellé « Notes » (s'applique à toute la proposition).
- `saveTaskEdits` continue de persister la note sur la tâche 1.

### 4. Date de relance 2 : pas de valeur par défaut
- `createTasksForProposal` : créer la tâche `relance_2` avec `due_date = null`.
- Migration : `ALTER TABLE proposal_tasks ALTER COLUMN due_date DROP NOT NULL;`.
- UI : afficher « Non planifiée » si vide, input date toujours éditable.

### 5. Validité 90 jours (au lieu de 30)
- Migration : `ALTER TABLE proposals ALTER COLUMN expires_at SET DEFAULT (now() + interval '90 days');`.
- Recaler `expires_at = created_at + 90 days` pour les propositions actives (`status ∈ {draft, sent}`) encore sur l'ancien défaut 30 jours (via tool insert).
- Front : adapter les libellés codés en dur (« valable X jours »).

### 6. Auto-archivage 7 jours après Relance 2
- Nouvelle edge function `auto-archive-proposals` :
  - Sélectionne `status = 'sent'` ET `reminder2_sent_at < now() - interval '7 days'`.
  - Update `status = 'archived'`, `lost_at = now()`, `lost_reason = 'Pas de réponse après relances'` si vide.
  - N'archive jamais une proposition sans relance 2 envoyée.
- Planifiée quotidiennement (08h) via `pg_cron` (créé via tool insert, contient anon key).

### 7. Accès complet aux archives
Sur la table « Archivées » :
- Ajouter colonne **Raison** (`lost_reason`).
- Ajouter bouton « Voir détails » → dialog lecture seule listant : date d'envoi, dates relance 1 & 2, date d'archivage, raison, et notes de relance (rendu HTML).
- Garder le bouton `Bell` (tâches/notes) actif en lecture seule sur les archives.

### 8. Passage manuel brouillon → envoyée
Sur les lignes en `status = 'draft'` :
- Bouton « Marquer comme envoyée » (icône `Check`) avec confirmation :
  - Update `status = 'sent'`, `sent_at = now()`.
  - Appelle `createTasksForProposal(id, now, proposal_type)`.
  - Aucun email envoyé.

---

### Détails techniques (interne)

- **Frontend** : `src/pages/Admin.tsx` (point 1 → `selectExistingClient` + fetch dernière proposition, point 2 → contextes mail, point 3 → dialog relances, point 4 → tâche relance 2, point 5 → libellés, point 7 → archives, point 8 → bouton draft→sent).
- **Backend** :
  - Edge function `supabase/functions/auto-archive-proposals/index.ts`.
  - Cron quotidien via `supabase--insert`.
- **Migrations** :
  - `proposal_tasks.due_date` nullable.
  - `proposals.expires_at` défaut 90 jours.
- **Data update** : recaler `expires_at` des propositions actives.

Ok pour que je lance les 8 points ?