Ajouter un bouton œil (consulter détails) dans `renderProposalRow` pour les propositions `status === "archived"` affichées dans l'onglet Envoyées (versions précédentes remplacées).

Bouton inséré juste avant Copier le lien (ligne ~2964), même action que dans l'onglet Archivées : `setArchiveDetailsId(p.id)`.

```tsx
{mode === "sent" && p.status === "archived" && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setArchiveDetailsId(p.id)}
    title="Voir détails"
  >
    <Eye className="h-4 w-4" />
  </Button>
)}
```
