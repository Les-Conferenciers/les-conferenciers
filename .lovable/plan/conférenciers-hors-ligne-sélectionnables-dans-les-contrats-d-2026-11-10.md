# Conférenciers « Hors ligne » sélectionnables dans les contrats directs

## Ce qui change
- Dans **« Nouveau contrat direct »**, la liste des conférenciers inclut aussi ceux qui sont hors ligne (fiches CRM uniquement, non visibles sur le site).
- Ils sont repérables par la mention **« (hors ligne) »** à côté du nom et apparaissent après les conférenciers en ligne, ou triés ensemble par ordre alphabétique avec la mention.
- Même chose dans le dossier, pour **ajouter ou changer de conférencier** dans le contrat (choix dans le CRM), pour rester cohérent.
- Rien ne change sur le site public : les conférenciers hors ligne restent invisibles.

## Détails techniques
- `AdminEventDossiers.tsx` (l. 224) et `EventDossier.tsx` (l. 478) : retirer le filtre `archived = false`, récupérer la colonne `archived`, afficher le suffixe « (hors ligne) » dans les listes et la recherche.
