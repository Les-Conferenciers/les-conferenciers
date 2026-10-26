# Mail conférencier : « hors frais VHR » en tutoiement + bon cachet

## Constats (BDC 1097, Déborah Pardo)
- Le bouton « Tutoiement » reconstruit le mail avec un texte de secours écrit à part, qui affiche « Budget : 4 000 € HT » sans « hors frais VHR ». Seul le modèle en vouvoiement contient la mention.
- Le budget du mail vient du cachet enregistré sur la fiche du conférencier (4 000 €), alors que le cachet retenu dans le contrat est de 3 500 € (commission 1 500 €, total 5 000 € HT).

## Changements
1. **Mention « hors frais VHR » toujours présente** dans la ligne Budget, en tutoiement comme en vouvoiement, pour le mail « infos » et le mail « contrat ».
2. **Bon montant du cachet** dans le mail, par ordre de priorité :
   - budget conférencier saisi dans le dossier, s'il existe ;
   - sinon le montant de la ligne conférencier du contrat (hors commission) ;
   - sinon le cachet de la proposition.
   Pour le 1097, le mail affichera 3 500 € HT, hors frais VHR.
3. **Le tutoiement suit le même modèle** que le vouvoiement : le texte est converti (« votre » → « ton », « Pourriez-vous » → « Peux-tu », etc.) au lieu d'utiliser un texte séparé, pour que les deux versions restent identiques sur le fond.

## Technique
- `EventDossier.tsx` : helper `getSpeakerBudget()` (event.speaker_budget → somme `contract_lines` type `speaker` → `ps.speaker_fee`) utilisé dans `buildSpeakerEmailBody` et `loadSpeakerEmailFromTemplate`.
- `budgetStr` du repli = `X € HT, hors frais VHR`.
- Boutons Tutoiement/Vouvoiement : appeler `loadSpeakerEmailFromTemplate(type, addressing)` puis appliquer une conversion vous→tu si `informal`; repli sur `buildSpeakerEmailBody` si le modèle est absent.
- Les brouillons déjà enregistrés ne changent pas : utiliser « Réinitialiser depuis le template » sur le 1097.
