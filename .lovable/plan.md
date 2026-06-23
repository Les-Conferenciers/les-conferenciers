## Problème

La popup « Créer une proposition » (et les autres dialogs propositions) affiche une barre de scroll horizontale. Cause racine : `DialogContent` shadcn utilise `grid w-full max-w-lg`. Quand un enfant grid n'a pas `min-w-0`, il prend sa taille **min-content** et peut dépasser la largeur du conteneur si un élément interne (long texte HTML injecté, mots non sécables, `<select>` avec longues options, etc.) ne se rétracte pas. Résultat : la grille devient plus large que la dialog → scroll horizontal.

## Correctifs

1. **`src/pages/Admin.tsx`** — sur toutes les `DialogContent` propositions/contrats (lignes 3467, 3731, 3932, 4051, 4254) :
   - Ajouter `overflow-x-hidden` à côté de `overflow-y-auto`
   
2. **`src/pages/Admin.tsx` (renderSpeakerForm, ligne 2021)** :
   - Ajouter `min-w-0` au wrapper racine `<div className="space-y-6 mt-4">` → `<div className="space-y-6 mt-4 min-w-0">`
   - Sur le `<select>` template (ligne 2052), ajouter `min-w-0` pour éviter qu'une longue option ne pousse la grille
   - Sur le `<div dangerouslySetInnerHTML>` (ligne 2250), ajouter `break-words` (déjà présent ? sinon `break-words min-w-0`)

3. **`src/pages/AdminProposals.tsx`** — appliquer la même protection sur les `DialogContent` lignes 644 et 774 (`overflow-x-hidden`).

## Résultat attendu

- Plus de barre horizontale dans aucune popup propositions
- Le contenu interne se rétracte proprement à la largeur de la dialog
- Aucun changement fonctionnel (UI seulement)