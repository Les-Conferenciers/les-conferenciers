# Afficher le « Format » dans le contrat

## Constat
Le format saisi dans le contrat (ex. BDC 1100 : « Table ronde ») est bien enregistré, mais il n'est jamais affiché dans la rubrique « Détails de l'événement ». Seul le texte libre « Détails » apparaît.

## Ce qui change
- Une ligne **« Format : Table ronde »** est ajoutée dans « Détails de l'événement », entre « Thématique » et « Détails ».
- Elle apparaît partout de la même façon : page de signature client, aperçu « Voir » de l'admin (modifiable en mode « Modifier ») et PDF.
- Si aucun format n'est renseigné, la ligne n'est pas affichée.
- Pour le BDC 1100, la ligne s'affichera directement. Les PDF déjà générés doivent être régénérés pour en tenir compte.

## Détails techniques
- `src/components/ContractParticulars.tsx` : ajout de `contract.event_format`.
- `src/pages/ContractView.tsx` : même ligne, avec un champ éditable en mode modification, enregistré dans `event_format`.
