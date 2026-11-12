# Montants de la proposition repris automatiquement dans le contrat

## Constat
- À la création du contrat, la ligne conférencier reprend le « prix total » de la proposition (cachet + commission), puis la commission est ajoutée à nouveau : il faut corriger le montant à la main.
- Quand on change de conférencier dans le dossier, le cachet de la fiche conférencier est utilisé, pas celui de la proposition.
- Si on modifie le cachet ou la commission dans la proposition après la création du contrat, le contrat ne change pas (ex. BDC-1111 : proposition 4 000 € / commission 0, contrat 2 700 € / 300 €).

## Ce qui change
1. **Création du contrat** : la ligne conférencier = cachet de la proposition, la commission agence = commission de la proposition (pour le conférencier retenu). Les frais de déplacement de la proposition sont ajoutés en ligne séparée s'ils existent.
2. **Modification de la proposition acceptée** : dès que le cachet ou la commission du conférencier retenu changent dans la proposition, le contrat en cours est mis à jour automatiquement (ligne conférencier + commission).
3. **Changement de conférencier dans le dossier** : on reprend son cachet et sa commission de la proposition. La fiche conférencier ne sert que s'il n'était pas dans la proposition.
4. **Contrats signés** : jamais modifiés automatiquement (le client a signé un montant). Un message vous l'indique, et vous passez par une nouvelle version « annule et remplace » si besoin.
5. Les autres lignes ajoutées à la main (prestations complémentaires) et la remise ne sont pas touchées.

## Détails techniques
- `EventDossier.tsx` / `ContractInvoiceManager.tsx` : `buildInitialLines` et `getEffectiveLines` utilisent `ps.speaker_fee` (+ ligne `travel` si `travel_costs`), commission depuis `ps.agency_commission`. Sélecteur de conférencier : valeurs `proposal_speakers` en priorité.
- Trigger DB `AFTER UPDATE OF speaker_fee, agency_commission, travel_costs ON proposal_speakers` : si la proposition est acceptée, met à jour le contrat non signé et non remplacé (`signed_at IS NULL AND superseded_at IS NULL`) dont le conférencier retenu correspond : remplace le montant de la ligne `speaker` et `agency_commission`.
- Même synchro déclenchée à l'acceptation de la proposition si un contrat existe déjà.
- Toast d'avertissement côté admin quand un contrat signé n'a pas été mis à jour.
- Test unitaire sur le calcul des lignes initiales (cachet + commission, sans double comptage).
