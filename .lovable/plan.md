# Mode édition par défaut pour l'admin

## Problème
Sur `/admin/contrat/:id` et `/admin/feuille-liaison/:id`, la page s'ouvre en lecture seule. Le bouton « Modifier » n'apparaît qu'après détection de la session admin, et tant qu'on n'a pas cliqué dessus, les champs restent en texte. Résultat : sensation que « rien n'est modifiable ».

## Solution
Forcer `editing = true` automatiquement dès que `isAdmin` passe à `true`, dans les deux pages.

### `src/pages/ContractView.tsx`
- Dans le `.then` de `supabase.auth.getSession()` (ligne 136), après `setIsAdmin(!!session)`, si la session existe → `setEditing(true)`.

### `src/pages/LiaisonSheetView.tsx`
- Idem ligne 114-115 : si `session && !isPublic` → `setEditing(true)`.

## Comportement après changement
- Admin qui ouvre `/admin/contrat/:id` ou `/admin/feuille-liaison/:id` → tous les champs sont directement éditables, boutons « Annuler » / « Enregistrer » visibles d'emblée.
- Lien public `/feuille-liaison/:token` (client/conférencier) → reste en lecture seule (isPublic = true).
- Bouton « Imprimer / PDF » reste disponible ; pour un PDF propre, l'admin peut cliquer « Annuler » avant impression (ou on peut ajouter un `@media print` qui masque les bordures d'input — à voir plus tard si besoin).

## Fichiers touchés
- `src/pages/ContractView.tsx` (1 ligne)
- `src/pages/LiaisonSheetView.tsx` (1 ligne)

Aucune modification de la base ou des autres pages.
