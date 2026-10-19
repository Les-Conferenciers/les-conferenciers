# PDF des contrats : ne plus couper une ligne de texte entre deux pages

## Constat
Aujourd'hui, l'endroit où une page se termine est calculé à partir de la position des paragraphes à l'écran. Le rendu en image peut décaler ces positions de quelques pixels. La coupure tombe alors au milieu de la dernière ligne, comme « l'identifier ; » sur votre capture.

## Ce qui change
- La coupure de page se fait uniquement dans un espace blanc entre deux lignes, repéré directement sur l'image du contrat. Une ligne ne peut donc plus être coupée en deux.
- On essaie d'abord de couper entre deux paragraphes ou articles, pour garder un article entier quand c'est possible. Sinon, on coupe entre deux lignes, jamais au milieu d'une ligne.
- Cela vaut pour la signature en ligne et pour le bouton « Régénérer le PDF signé ».

## Détails techniques
- Fichier `src/lib/contractPdf.ts`. Pour chaque page, partir de la hauteur maximale et remonter ligne de pixels par ligne de pixels sur le canvas, jusqu'à trouver une bande d'au moins 4 px entièrement blanche sur la largeur (seuil > 245).
- Priorité aux points de coupure entre blocs, à condition qu'ils tombent dans une bande blanche. Sinon, prendre la bande blanche la plus basse trouvée dans la seconde moitié de la page. En dernier recours seulement, garder la coupure brute.
- Vérification : générer le PDF du BDC 1088, puis contrôler en images chaque bas et haut de page.
