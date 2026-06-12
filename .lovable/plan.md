## Mise à jour du wording du contrat conférencier

Remplacement intégral du bloc "Conditions générales du contrat conférencier" dans `src/pages/SpeakerContractView.tsx` (lignes 148-195) par le wording complet fourni.

### Points clés
- Restitution de l'orthographe correcte (fautes d'extraction PDF type « défnir », « confdentiel », « afn », « justifcatif » → « définir », « confidentiel », « afin », « justificatif »).
- Apostrophes droites (règle projet).
- Structure HTML conservée : `<h3 class="font-bold mb-2">` + `<p>` / `<p class="mt-1">`, taille `text-[12px]`.
- Articles 2.1 à 2.5 développés intégralement (vs version actuelle très résumée).
- Articles 3, 5, 7 redéveloppés intégralement.

### Hors scope
- Pas de modification du contrat client (déjà fait précédemment).
- Pas de système d'overrides éditables côté admin pour le contrat conférencier (le wording reste codé en dur dans la page, conformément à l'architecture actuelle).
- Pas de migration BDD.

### Fichier modifié
- `src/pages/SpeakerContractView.tsx` (bloc articles 1 à 8 uniquement).
