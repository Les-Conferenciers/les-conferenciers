## Diagnostic

J'ai vérifié les deux dossiers dans la base. Les deux bugs viennent de la même cause : **plusieurs propositions coexistent pour le même client, et les tâches de relance restent vivantes sur les anciennes versions**.

### 1) GE HEALTHCARE — SABINE.BEAUVALLET@gehealthcare.com

Il y a **deux propositions distinctes** (non liées par `previous_proposal_id`) :

| Proposition | Envoyée le | Tâches |
|---|---|---|
| `412f34f6…` | 30/04/2026 | Relance 1 ✔ envoyée le 18/05 · **Relance 2 pending due 16/06 (aujourd'hui)** |
| `a53d7106…` | 09/04/2026 | **Aucune tâche** (créée avant le système de tâches) |

L'agenda d'aujourd'hui pointe donc sur la première. Mais dans le CRM, vous avez très probablement cliqué « Relances » sur la seconde (celle sans tâches) → le dialogue affiche « Aucune tâche créée pour cette proposition », donc impossible de reprogrammer la Relance 2 qui est sur l'autre proposition.

### 2) PRO BTP — p.bonnac@probtp.com

**Trois propositions** :

| Proposition | Envoyée le | Statut | Tâches |
|---|---|---|---|
| `9c224e05…` | 08/06 | sent | Relance 2 ✔ envoyée 15/06 · Relance 1 pending due **22/06** (J+8 que vous avez planifié hier) |
| `658a8658…` | 22/05 | sent | Relance 1 ✔ envoyée 29/05 · **Relance 2 pending due 16/06 (l'agenda remonté ce matin)** |
| `77318d32…` | 21/05 | archived | pending mais ignorée par le recap |

Votre diagnostic est exact : la tâche planifiée hier était sur la proposition de juin, et la Relance 2 de la proposition de mai est restée active.

## Plan de correction

### A. Fermer automatiquement les tâches obsolètes d'une proposition sœur

Quand une relance est envoyée OU planifiée sur une proposition, marquer comme `cancelled` toutes les tâches `pending` des autres propositions partageant le même `client_email` (insensible à la casse) qui ne sont pas en statut `accepted` / `lost`.

- Déclencheurs côté code :
  - `handleReminder` (envoi de relance dans `Admin.tsx`)
  - `saveTaskEdits` (modification/reprogrammation d'une tâche)
  - `handleSend` (envoi initial d'une nouvelle proposition à un client qui en a déjà)
- Nouveau statut `cancelled` ajouté à `proposal_tasks.status` (par défaut `pending`/`completed` aujourd'hui).
- Le récap quotidien (`daily-task-recap`) filtre déjà `lost/archived/accepted` ; ajouter le filtre `status != 'cancelled'` et également exclure les tâches dont une **proposition sœur plus récente** (même `client_email`) est en `sent`/`accepted`. Ceinture + bretelles.

### B. Dialogue « Relances » plus tolérant

Dans `openReminderDialog`, charger non seulement les tâches de la proposition cliquée, mais aussi les tâches `pending` des propositions sœurs (même `client_email`). Les afficher dans une section « Tâches actives sur ce client » avec mention de la proposition d'origine, pour permettre la reprogrammation depuis n'importe quel point d'entrée. Cela règle aussi le cas GE HEALTHCARE.

### C. Nettoyage one-shot des données existantes

Migration de données :
- Pour chaque `client_email`, conserver les tâches `pending` uniquement sur la proposition `sent`/`accepted` la plus récente ; passer les autres en `cancelled` avec une note `superseded_by=<proposal_id>`.
- Concrètement : passera en `cancelled` la Relance 2 du 16/06 de PRO BTP `658a8658…` (déjà gérée par la nouvelle Relance 1 du 22/06 sur `9c224e05…`). Garde la Relance 2 du 16/06 de GE HEALTHCARE puisque c'est la proposition la plus récente du client.

### Détails techniques

- Fichiers modifiés : `src/pages/Admin.tsx` (handlers + dialogue), `supabase/functions/daily-task-recap/index.ts` (filtre).
- Migration SQL : ajout (si absent) de la valeur `cancelled` dans le check de `proposal_tasks.status`, + UPDATE de nettoyage.
- Pas de changement de schéma majeur.

Souhaitez-vous que je lance ces 3 actions (A + B + C) ?
