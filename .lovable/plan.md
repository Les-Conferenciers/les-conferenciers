# Fix popups coupées dans Admin.tsx

Les dialogs de `src/pages/AdminProposals.tsx` et `ContractInvoiceManager.tsx` ont déjà été corrigés. Mais le dialog "Éditer la proposition" (et plusieurs autres dialogs frères) vit dans `src/pages/Admin.tsx` et utilise encore l'ancien pattern `max-h-[90vh]` → la fenêtre se retrouve coupée en bas sur MacBook Air.

## Dialogs concernés dans `src/pages/Admin.tsx`

| Ligne | Dialog |
|------|--------|
| 3467 | (premier dialog, max-w-2xl) |
| 3731 | **Éditer la proposition** |
| 3932 | dialog max-w-2xl (max-h-[85vh]) |
| 4051 | dialog max-w-3xl |
| 4254 | dialog max-w-2xl |

## Changement à appliquer

Pour chacun de ces 5 `DialogContent`, remplacer la classe actuelle par le même pattern que `ContractInvoiceManager` / `AdminProposals` :

```tsx
<DialogContent className="w-[min(<largeur>,calc(100vw-2rem))] max-w-none max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden p-0 min-w-0">
  <DialogHeader className="px-6 pt-6 pb-2 shrink-0 border-b border-border">
    <DialogTitle ... />
  </DialogHeader>
  <div className="space-y-5 px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 min-w-0">
    {/* contenu existant */}
  </div>
</DialogContent>
```

Largeur cible :
- `max-w-2xl` → `42rem`
- `max-w-3xl` → `48rem`

## Hors scope

- Aucun changement de logique métier, d'emails, de données.
- Les 4 petits dialogs (`max-w-md` lignes 4320/4357/4398) ne sont pas affectés car courts — ne pas y toucher.
- Aucun changement dans les fichiers déjà corrigés.

## Vérification

Capture Playwright en viewport 1139×779 sur `/admin?tab=propositions` :
1. Ouvrir "Éditer la proposition" sur une proposition envoyée → header visible, contenu défilable, bouton bas atteignable.
2. Vérifier les autres dialogs (envoi, prévisualisation) ouverts depuis Admin.tsx.
