## Constat

Aujourd'hui le bouton **Modifier** est toujours actif, même après envoi ou signature, sans aucun garde-fou. Ce n'est ni rigoureux juridiquement, ni traçable.

## Proposition

Logique selon le statut du contrat :

| Statut | Action | Comportement |
|---|---|---|
| `draft` | Modifier | Édition libre comme aujourd'hui. |
| `sent` (envoyé, non signé) | Modifier | Ouvre l'éditeur avec un bandeau orange : « Ce contrat a déjà été envoyé. Toute modification créera une nouvelle version qui annulera la précédente. » Au save → bump `version`, statut repasse à `draft`, on enregistre un historique. Au renvoi suivant → l'objet de mail est préfixé `[ANNULE ET REMPLACE — v{n}]` et le PDF affiche la mention « Cette version annule et remplace la version précédente du {date} ». |
| `signed` | Modifier | Bouton remplacé par **Créer un avenant** → duplique le contrat avec `version = n+1`, `replaces_contract_id = ancien`, statut `draft`. L'ancien contrat signé reste intouchable, visible dans un encart « Versions précédentes ». |

## Changements techniques

### 1. Migration SQL (`contracts`)

Ajouter :
- `version int not null default 1`
- `replaces_contract_id uuid` (FK logique vers contracts.id, sans contrainte forte)
- `superseded_at timestamptz`
- `superseded_by_contract_id uuid`

Aucune RLS à toucher.

### 2. UI `EventDossier.tsx` (zone contrat ~1689-1707)

- Bouton **Modifier** :
  - `draft` → comportement actuel.
  - `sent` → ouvre le dialogue avec bandeau d'avertissement + au save, appelle `reviseContract()` qui crée la nouvelle version, marque l'ancienne `superseded_at = now()`, et bascule l'affichage sur la nouvelle.
  - `signed` → bouton renommé **Créer un avenant**, même flux que `sent` mais le nouveau contrat démarre vide-pré-rempli et garde la référence.
- Ajouter un petit composant « Versions précédentes » sous le contrat actif listant les anciennes versions cliquables (lien `/admin/contrat/{id}`).

### 3. Email de renvoi (`send-contract-email`)

- Si `version > 1` → sujet préfixé `[ANNULE ET REMPLACE — v{n}]` et corps mentionnant l'annulation de la version précédente.

### 4. PDF contrat (`ContractView.tsx`)

- Si `version > 1`, ajouter en tête du contrat la mention :  
  « **Cette version annule et remplace la version v{n-1} émise le {date}.** »

## Hors scope (à valider ensuite)

- Faut-il aussi conserver une copie PDF figée de chaque version envoyée dans le bucket `signed-contracts` ? (utile en cas de litige) — je peux l'ajouter si tu veux.
- Faut-le appliquer le même principe aux **factures** envoyées ?
