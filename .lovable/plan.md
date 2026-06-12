## Mise à jour du wording des articles du contrat

Remplacement intégral du contenu HTML par défaut des 11 articles dans `src/lib/contractClauses.ts` (`DEFAULT_CLAUSES`) par le wording exact fourni.

### Points clés
- Correction des nombreuses fautes de saisie (« défnition », « confdentiel », « identifé », « profl », « modifer »…) en orthographe correcte (« définition », « confidentiel », « identifié », « profil », « modifier »…) : ces fautes étant des artefacts d'extraction PDF (lettres « fi » manquantes), je restitue les bons mots.
- Apostrophes droites conservées (règle projet).
- Structure HTML identique à l'existante (`<p>`, `<ul class="list-disc pl-5">`, `<strong>`, classes `mt-1`/`mt-2`).
- **Article 5** : conservation du placeholder `{{PRICE_CLAUSE}}` pour 5.1 (généré dynamiquement selon `deposit_required`). Le wording fourni pour 5.1 (acompte 50% + solde 7j avant) sera intégré comme **fallback par défaut** du `PRICE_CLAUSE` côté code générant la clause prix — à vérifier dans `ContractView.tsx`/`SpeakerContractView.tsx`. Si le wording fourni doit **toujours** s'afficher (et écraser la logique conditionnelle), me le confirmer.
- **Article 9** : ajout du bloc COVID-19 absent de la version actuelle.
- **Article 10** : ajout du paragraphe "Ordre public" absent.
- Aucun changement sur la logique d'overrides (`custom_clauses.articles[key]`), les `ClauseKey`, ni la signature des fonctions exportées.

### Fichiers modifiés
- `src/lib/contractClauses.ts` — remplacement de `defaultHtml` pour `art1`…`art11`.

### Hors scope
- Pas de modification du rendu (`ContractView.tsx`, `SpeakerContractView.tsx`).
- Pas de migration SQL (les contrats existants conservent leurs `custom_clauses` ; les nouveaux contrats utiliseront le nouveau wording).
- Pas de mise à jour rétroactive des contrats déjà signés.

### Question
Pour l'article 5.1, dois-je :
- **(a)** garder la logique conditionnelle actuelle (acompte ou pas d'acompte selon `deposit_required`) avec le nouveau wording fourni comme version "avec acompte", ou
- **(b)** imposer systématiquement le wording fourni (50% à 30j + 100% à 7j avant) quel que soit le réglage ?
