# Bug : un caractère par frappe dans la feuille de liaison

## Cause

Dans `src/pages/LiaisonSheetView.tsx`, les composants `Field` (ligne 131) et `TextArea` (ligne 138) sont **déclarés à l'intérieur** du composant `LiaisonSheetView`. À chaque frappe :

1. Un state change (`setEventTheme`, etc.) déclenche un re-render de `LiaisonSheetView`.
2. `Field` et `TextArea` sont **recréés comme de nouveaux types de composants** à chaque render.
3. React voit un type différent → il **démonte** l'`<input>` précédent et en **monte un nouveau**.
4. Le focus est perdu → impossible de taper plus d'un caractère.

C'est pour ça que `ContractView.tsx` n'a pas le problème : il utilise directement des `<input>`/`<Textarea>` inline, sans wrapper recréé à chaque render.

## Correctif

Remplacer les wrappers internes `Field` et `TextArea` par un rendu inline ternaire (comme déjà fait pour le champ date à la ligne 183-187), ou déplacer ces composants **hors** de `LiaisonSheetView` (au niveau module, comme `EditableField` qui lui est correct).

Option retenue : **déplacer `Field` et `TextArea` hors du composant**, car ça garde le JSX lisible. Aucune autre logique modifiée, seul le périmètre de déclaration change.

## Fichier modifié

- `src/pages/LiaisonSheetView.tsx` : extraire `Field` et `TextArea` au niveau module (juste après `EditableTextArea`), avec une prop `editing: boolean`. Mettre à jour les ~6 appels pour passer `editing={editing}`.

## Hors scope

- Aucun changement au schéma, à la logique de sauvegarde, ou au rendu non-éditable.
- Aucun impact sur `ContractView.tsx` qui fonctionne déjà correctement.
