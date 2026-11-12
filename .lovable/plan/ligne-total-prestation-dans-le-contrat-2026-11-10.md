# Ligne « Total Prestation » dans le contrat

## Ce qui change
Dans la rubrique « Montant de la prestation » du contrat, une ligne de total s'ajoute sous les lignes existantes, en gras :

> **Total Prestation : 5 028 € TTC, soit 4 190 € HT**

- Elle s'affiche dès qu'il y a au moins deux lignes (intervenant + frais de déplacement, ou prestation complémentaire).
- En cas de remise, le total affiché tient compte de la remise.
- Elle apparaît partout de la même façon : page de signature client, aperçu « Voir » dans l'admin, PDF téléchargé.
- Les contrats déjà signés gardent leur PDF existant ; un nouveau PDF régénéré inclura la ligne.

## Détails techniques
- `src/components/ContractParticulars.tsx` : calcul HT = somme des `amount_ht` × (1 − remise), TTC = somme des montants TTC × (1 − remise), affichage après la liste des lignes.
- `src/pages/ContractView.tsx` : même ajout dans le bloc « Montant de la prestation » encore présent dans cette page, pour garder les deux rendus identiques.
