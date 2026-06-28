## Problème

Quand on change le conférencier depuis `/admin/contrat/:id`, on met bien à jour `contracts.selected_speaker_id` + `events.selected_speaker_id` et on crée éventuellement une ligne vide dans `proposal_speakers`. Mais :

1. **Ligne de facturation du contrat** : `contract_lines` est un JSON figé qui contient `label: "Laurent Alexandre"`. On ne réécrit pas ce label au changement de conférencier → le contrat et la facture (qui lisent `contract_lines`) restent sur l'ancien nom.
2. **Facture** : même cause (lit `contract_lines`).
3. **Feuille de liaison** + **Communication conférencier** : font `proposal_speakers.find(s => s.speaker_id === selected_speaker_id)`. La nouvelle ligne `proposal_speakers` est bien créée, mais avec `base_price/total_price = 0`, et surtout — si pour une raison quelconque elle n'est pas créée (ex. `proposal_id` manquant ou erreur silencieuse), le fallback retombe sur le premier conférencier (= l'ancien).

## Correctif (frontend uniquement, sur `src/pages/ContractView.tsx`)

Dans `handleSave`, quand `speakerChanged` :

1. **Récupérer le nom + tarifs de l'ancien `proposal_speakers`** (celui qui correspond à `contract.selected_speaker_id` actuel, sinon le premier).
2. **Cloner ses montants** (`speaker_fee`, `travel_costs`, `agency_commission`, `total_price`, `base_price`) dans la ligne `proposal_speakers` du nouveau conférencier — au lieu d'insérer des zéros. Si la ligne existe déjà, la mettre à jour avec ces montants seulement si elle est à 0.
3. **Réécrire `contract_lines`** : pour chaque ligne `type === "speaker"` dont le `label` correspond à l'ancien nom (ou s'il n'y a qu'une seule ligne speaker), remplacer `label` par le nom du nouveau conférencier. Persister le tableau modifié dans `contracts.contract_lines`.
4. **Garde-fou** : s'assurer que l'insertion `proposal_speakers` est `await`ée avant le `update` du contrat (déjà le cas) et logguer un `toast.error` explicite si elle échoue, pour éviter le fallback silencieux côté feuille de liaison.

## Vérifications post-fix (à la main par l'utilisateur)

- Le contrat affiche le nouveau nom dans la ligne de facturation.
- La feuille de liaison affiche le nouveau conférencier + son téléphone.
- Le bloc "Communication conférencier" du dossier événement cible le nouveau conférencier.
- La facture (BDC déjà existant) affiche le nouveau nom dans la ligne "Conférencier".

Aucun changement de schéma DB requis. Les anciens dossiers où le changement a déjà été fait (ex. Davido v3 → Régis Rossi) devront être réenregistrés une fois après le fix pour réécrire `contract_lines`.
