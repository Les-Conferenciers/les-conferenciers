## Changements

### 1. `src/pages/Admin.tsx` (flux de mise à jour, lignes 1383-1412)

Supprimer le passage `status: "archived"` + `lost_reason` + `lost_at` sur l'ancienne proposition. On garde uniquement :
- la copie des notes vers la nouvelle ;
- la suppression des `proposal_tasks` `pending` de l'ancienne (coupe les relances).

L'ancienne reste en `status: "sent"`. Le badge `vN` déjà en place (ligne 2779) marque les versions précédentes.

### 2. Onglet Envoyées — aucun changement de rendu

`buildSentEntries` (ligne 3119) regroupe déjà toutes les propositions d'un même `client_id` derrière un toggle « X propositions ». Les anciennes versions y apparaissent donc naturellement avec les nouvelles.

### 3. Onglet Archivées

Plus aucune proposition issue d'une mise à jour ne tombe ici. La logique de regroupement par chaîne dans cet onglet (lignes 3374-3415) devient sans objet mais on la laisse en place (no-op quand il n'y a pas de chaînes).

### 4. `supabase/functions/auto-archive-proposals/index.ts`

Aujourd'hui : archive toute `status = sent` dont la relance 2 date > 7j. Exclure les propositions remplacées (celles dont l'`id` est `previous_proposal_id` d'une autre), sinon une ancienne version serait re-archivée par le cron.

Pour valider, dis-moi de passer en mode build.
