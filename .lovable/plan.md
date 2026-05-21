# Plan — Notes de relance persistantes + regroupement des propositions archivées

## Constat (sur Davido)

**Bug 1 — Notes des relances** : aujourd'hui les `proposal_tasks` (et donc le champ `note`) ne sont créées qu'**au moment de l'envoi** de la proposition (`createTasksForProposal`, Admin.tsx:1098). Conséquence :
- Impossible d'écrire une note tant que la proposition n'a pas été envoyée au moins une fois.
- La copie de notes d'une version à l'autre (Admin.tsx:1100-1116) ne fonctionne que si `andSend === true` ET si des `proposal_tasks` existent déjà sur l'ancienne. Dès qu'on enchaîne brouillons / éditions sans tâches sources, les notes sont perdues.

**Bug 2 — Archives non groupées** : l'onglet « Archivées » (Admin.tsx:2431-2498) affiche un tableau **plat**. Plusieurs propositions envoyées au même client pour le même événement (typiquement la chaîne v1 → v2 → v3 archivées au fil des mises à jour) apparaissent comme des lignes indépendantes.

## Solution

### 1. Champ « Notes internes » persistant sur la proposition

Ajouter une colonne `internal_notes` (text, nullable) sur `proposals`. Cette note est :

- **Éditable dans le formulaire de création/édition** (dialog "Nouvelle proposition" / "Modifier le brouillon"), zone Textarea visible dès le brouillon — pas besoin d'envoyer pour la sauvegarder.
- **Pré-remplie automatiquement** quand on crée une nouvelle version via "Mettre à jour" : on récupère `internal_notes` de la proposition précédente. Si vide, on tombe en repli sur la note de la `relance_1` de cette proposition précédente. La note suit ainsi la chaîne v1 → v2 → v3 sans intervention.
- **Recopiée dans la `proposal_tasks.note` de la `relance_1`** au moment de la création des tâches (sur envoi), pour rester visible dans le dialog de relance existant.
- **Mise à jour bidirectionnelle** : si l'utilisateur édite la note dans le dialog "Tâches de relance" (`saveTaskEdits`), on synchronise aussi `proposals.internal_notes` pour que la prochaine version la reprenne.

**Affichage** : un seul champ « Notes internes (relances et suivi) » dans le formulaire de proposition, sous les infos événement. Ainsi qu'un rappel en lecture seule dans le dialog d'envoi de relance (déjà présent, on s'assure qu'il pointe sur `internal_notes` à défaut de la note de tâche).

### 2. Regroupement des propositions archivées (toggle)

Critère de groupement : **chaîne de versions** suivie via `previous_proposal_id` (lien canonique déjà posé par "Mise à jour", Admin.tsx:1077). Si la chaîne contient plusieurs propositions archivées du même client → un seul groupe pliable avec compteur "v1 · v2 · v3".

Pourquoi `previous_proposal_id` plutôt que `client_id + event_date_text` ? Plus fiable : pas de faux positifs sur deux événements différents du même client la même année, et déjà alimenté correctement par le flow "Mise à jour".

UI :
- Rendu calqué sur le groupement existant `buildSentEntries` / `renderGroupedSentTable` de l'onglet "Envoyées" (toggle chevron, ligne d'entête + lignes versions repliables).
- Une seule ligne quand la chaîne ne contient qu'un élément archivé (comportement actuel préservé).
- Le tri par date utilise la version la plus récente du groupe.

## Plan technique

1. **Migration Supabase** : `ALTER TABLE public.proposals ADD COLUMN internal_notes text;` — pas de RLS à modifier (politiques existantes couvrent déjà la colonne).

2. **`src/pages/Admin.tsx`** :
   - Ajouter `internalNotes` (`useState`) dans le formulaire, charger depuis la proposition lors de l'édition, vider dans `resetForm`.
   - Ajouter un Textarea "Notes internes (relances et suivi)" dans le DialogContent de création / édition (lignes 2404 et 2532).
   - Pré-remplissage dans le handler "Mettre à jour" : lire `internal_notes` puis fallback sur `proposal_tasks.note` de relance_1 de la proposition source.
   - À l'`INSERT` de proposition (ligne 1069) : inclure `internal_notes`.
   - `handleSaveEdit` : `UPDATE` la colonne.
   - `createTasksForProposal` : si `internal_notes` non vide, l'insérer comme `note` de la relance_1.
   - `saveTaskEdits` : après update des tasks, synchroniser `internal_notes` sur la proposal courante avec la note de relance_1.
   - Onglet Archivées : remplacer la table plate (lignes 2431-2498) par un rendu groupé inspiré de `renderGroupedSentTable`, en groupant via la chaîne `previous_proposal_id`. Réutiliser `expandedGroupId` (déjà en place pour "Envoyées") ou créer `expandedArchivedGroupId` pour ne pas interférer.

3. **Aucun changement** sur les edge functions (`send-proposal-email`, `send-proposal-reminder`), sur le PDF, sur les emails clients. La note reste strictement interne.

## Garde-fous

- Pas de changement de schéma destructif (colonne ajoutée, nullable).
- Pas de modification des politiques RLS existantes.
- Pas de modification du contenu envoyé au client.
- Les propositions Davido existantes : la nouvelle colonne sera vide initialement. À la prochaine "Mise à jour", le fallback ira chercher les notes de relance_1 existantes — donc rien n'est perdu rétroactivement.
- Le groupement archivé tombe en "ligne simple" si pas de chaîne → zéro régression sur les archives indépendantes.

## Hors scope

- Notes par version distinctes (le besoin exprimé est "transmettre", donc note partagée et reportée automatiquement).
- Historisation des notes (chaque version peut écraser la précédente — comportement attendu d'une note de suivi vivante).
- Renommage / refactor du composant Admin (déjà imposant, à traiter séparément).
