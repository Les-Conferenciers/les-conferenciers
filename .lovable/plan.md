## Plan — Évolutions Propositions (4 points)

### 1. "Nouvelle proposition" pour un même client → Mise à jour (avec historique)

Aujourd'hui, le bouton "+ Nouvelle" (`handleNewProposalForClient`) ouvre un dialog vide qui crée une 2ᵉ proposition indépendante. Nouveau comportement : on ouvre le dialog en mode **"mise à jour"**, déjà pré-rempli depuis la proposition source, et on garde une trace claire des 2 envois côté admin.

À faire dans `src/pages/Admin.tsx` :
- Libellé du bouton : "Mettre à jour & renvoyer" (icône `RefreshCw`).
- `handleNewProposalForClient(clientId, latest)` : pré-remplir tous les champs (déjà OK) **+ pré-cocher la sélection de conférenciers** depuis `latest.proposal_speakers` comme point de départ modifiable.
- À l'envoi : créer bien une **nouvelle ligne** `proposals` mais :
  - **Reporter les notes** de la relance 1 source vers la nouvelle (copie de `proposal_tasks.note`).
  - **Lier les 2 propositions** via `previous_proposal_id` (migration).
  - **Archiver automatiquement** la précédente avec `lost_reason = '[Mise à jour] Remplacée par une nouvelle proposition'`, et **supprimer ses tâches de relance pending**.
- Affichage admin : badge "v2", "v3"... à côté du nom du client (chaîne `previous_proposal_id`). Au clic → dialog "Historique" listant chaque envoi (date, type, conférenciers) en lecture seule.

Migration SQL :
```sql
ALTER TABLE proposals ADD COLUMN previous_proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL;
CREATE INDEX idx_proposals_previous ON proposals(previous_proposal_id);
```

### 2. Demande d'infos → Proposition (multiple ou unique) à tout moment

À faire :
- Bouton "▶ Convertir en proposition" (icône `Send`) sur toute ligne `proposal_type === 'info'` (envoyées ou brouillons) qui ouvre `infoAcceptDialogOpen`.
- `handleInfoAcceptConvert` :
  - Pré-remplir aussi `eventLocation`, `eventDateText` (formaté FR), `audienceSize` depuis la demande d'infos.
  - **Supprimer les tâches de relance** rattachées à la demande d'infos avant archivage.
  - Lier la nouvelle proposition via `previous_proposal_id`.
  - Garder l'archivage avec `lost_reason = '[Convertie] Transformée en proposition'`.

### 3. Mail "Demande d'infos" — paragraphe enveloppe budgétaire

`getInfoEmailBody` (ligne 236) : retirer la puce "Votre enveloppe budgétaire" de la liste et insérer après la liste :

> "Concernant votre enveloppe budgétaire : le tarif moyen des conférenciers se situe entre 4K et 7K HT, hors frais VHR. L'idéal serait de nous indiquer si votre budget se situe dans cette fourchette, au-dessus ou en-dessous, sachant que les premiers tarifs de notre offre se situent autour des 2,5K HT, hors frais VHR."

### 4. Mail de relance suite à une demande d'infos — nouveau template + relance 2 activée

Dans `supabase/functions/send-proposal-reminder/index.ts`, remplacer le bloc `proposalType === "info"` par (identique pour relance 1 et 2) :

```
Bonjour,

Je reviens vers vous suite à mon précédent mail.

Avez-vous pu en prendre connaissance ?

Votre recherche d'intervenant est-elle toujours d'actualité ?

Vous remerciant par avance de votre retour et restant à votre écoute, je vous souhaite une excellente journée.
```

**+ Activer la relance 2 pour les demandes d'infos** : dans `createTasksForProposal`, retirer la garde `if (pType !== "info")` afin de créer la tâche `relance_2` avec `due_date = null` (comme pour les autres types — admin la planifie manuellement).

---

### Détails techniques

- **Frontend** : `src/pages/Admin.tsx` — `handleNewProposalForClient`, `handleSubmit` (branche update), `handleInfoAcceptConvert`, `getInfoEmailBody`, `createTasksForProposal`, bouton "Convertir" sur lignes `info`, badge versionnage + dialog historique.
- **Backend** : `supabase/functions/send-proposal-reminder/index.ts` — bloc `proposalType === "info"`.
- **Migration SQL** : `proposals.previous_proposal_id` (déjà appliquée).

Ok pour que je lance les 4 points ? (passe en mode build)
