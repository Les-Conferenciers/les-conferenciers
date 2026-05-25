## Diagnostic

Le bouton « Aperçu de la feuille » appelle `handlePreviewLiaisonSheet` (`src/components/admin/EventDossier.tsx`, ligne 1180) :

```ts
const handlePreviewLiaisonSheet = async () => {
  await persistLiaisonFields();
  await fetchData();
  window.open(`/admin/feuille-liaison/${proposal.id}`, "_blank");
};
```

Les navigateurs exigent que `window.open` soit appelé **dans le même tick** que le clic utilisateur. Après `await`, le « user gesture » est perdu et le popup est bloqué silencieusement → l'onglet ne s'ouvre jamais, sans message d'erreur visible.

## Correctif

Ouvrir l'onglet **immédiatement** au clic, puis y rediriger une fois la sauvegarde terminée :

```ts
const handlePreviewLiaisonSheet = async () => {
  const w = window.open("about:blank", "_blank");
  try {
    await persistLiaisonFields();
    await fetchData();
  } finally {
    const url = `/admin/feuille-liaison/${proposal.id}`;
    if (w) {
      w.location.href = url;
    } else {
      // Fallback si bloqué quand même : navigation in-place
      window.location.href = url;
    }
  }
};
```

Cela :
- préserve le user gesture (popup non bloqué) ;
- conserve la persistance avant aperçu ;
- garde l'édition admin disponible (la page `LiaisonSheetView` détecte déjà la session via `supabase.auth.getSession()` et affiche les boutons « Modifier / Enregistrer »).

## Fichier modifié
- `src/components/admin/EventDossier.tsx` (fonction `handlePreviewLiaisonSheet`, ligne 1180)

## Hors scope
Ce plan corrige uniquement le bug d'aperçu. Les évolutions discutées précédemment (tu/vous, éditeur enrichi, accusé en gras, date dans l'objet, page publique de la feuille de liaison via token) restent en attente et pourront être traitées dans un plan séparé.
