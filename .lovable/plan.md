## Objectif

Dans les emails envoyés au conférencier (Communication conférencier — templates `speaker_event_info` et `contract_to_speaker`), la ligne « 🚗 Frais VHR » doit refléter la **somme des lignes du contrat de type "Déplacement" (`travel`) + "Autre" (`custom`)**, et non plus le champ `proposal_speakers.travel_costs`.

Exemple Davido Consulting : ligne Déplacement 100 € + ligne Autre 200 € → `Frais VHR : 300 € HT`.

Comportement conservé :
- Si la somme est 0 (aucune ligne travel/custom), la ligne n'apparaît pas (grâce à la syntaxe conditionnelle `{{#frais_vhr}}` du template + fallback hardcodé qui masque déjà quand vide).
- Position inchangée : juste sous « 💰 Budget » (ou « 📝 Détails » quand présent), au-dessus des infos logistiques.

## Fichier touché

`src/components/admin/EventDossier.tsx`

### `buildSpeakerEmailBody` (fallback hardcodé) — l. ~1104 et ~1178

Remplacer :
```ts
const travel = ps?.travel_costs || 0;
```
par un calcul basé sur `contract?.contract_lines` :
```ts
const lines = Array.isArray(contract?.contract_lines) ? contract.contract_lines : [];
const travel = lines
  .filter((l: any) => l?.type === "travel" || l?.type === "custom")
  .reduce((sum: number, l: any) => sum + (Number(l?.amount_ht) || 0), 0);
```
`vhrStr` reste identique (`travel > 0 ? "${travel.toLocaleString("fr-FR")} € HT" : ""`).

### `loadSpeakerEmailFromTemplate` — l. ~1178

Même remplacement pour alimenter la variable `frais_vhr` passée à `renderTpl` — les templates DB avec `{{#frais_vhr}}…{{/frais_vhr}}` masqueront la ligne quand la somme est 0.

## Non-impact

- Les dossiers avec brouillon déjà enregistré (`speaker_info_email_body`, `speaker_contract_email_body`) continueront d'afficher l'ancien montant tant que l'utilisateur ne clique pas sur **« Réinitialiser depuis le template »** dans le dialog Communication conférencier — comportement voulu, déjà en place.
- Aucune modification des templates DB ni du moteur `emailTemplates.ts`.
- Aucune modification de la facturation ni du champ `travel_costs` sur `proposal_speakers`.
