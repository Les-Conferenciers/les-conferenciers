# Édition du conférencier sur `/admin/contrat/:id`

## Problème
Sur la page `ContractView` (visualisation/impression du BDC), le mode édition admin permet de modifier les détails de l'événement mais pas le conférencier retenu. Cette fonctionnalité existe déjà dans `EventDossier` (dossier admin) mais n'est pas dupliquée ici.

## Modification — `src/pages/ContractView.tsx`

### 1. Charger la liste des conférenciers du CRM
Au chargement (quand `isAdmin` est vrai), récupérer `id`, `name`, `gender` depuis la table `speakers` (triés alphabétiquement) et les stocker dans `allSpeakers`.

### 2. Ajouter un état local `selectedSpeakerId`
Initialisé à `contract.selected_speaker_id` (ou au speaker actuel via le fallback event/proposal).

### 3. UI en mode édition — section « Intervenant »
Remplacer le `<p>{speakerGender} {firstSpeaker?.name}</p>` par :
- Un `<select>` listant `allSpeakers` (option courante pré-sélectionnée).
- Note discrète : « Modifier le conférencier retenu pour ce contrat ».

Hors édition : affichage actuel inchangé.

### 4. Logique de sauvegarde (`handleSave`)
Étendre la mise à jour pour inclure `selected_speaker_id` :
- `UPDATE contracts SET selected_speaker_id = ?` (en plus des champs existants).
- Si un `event.id` est présent, également `UPDATE events SET selected_speaker_id = ?` pour rester cohérent avec EventDossier.
- Si le nouveau speaker n'existe pas dans `proposal_speakers` pour cette proposition, insérer une ligne `proposal_speakers` (proposal_id, speaker_id, base_price=0, total_price=0) — comportement aligné sur EventDossier.
- Rafraîchir via `fetchAll()`.

### 5. Lignes du contrat
**Hors scope** : on ne modifie pas automatiquement les `contract_lines` ici (le montant doit rester celui négocié). Le libellé de la ligne speaker n'est pas réécrit — l'admin pourra ajuster manuellement depuis le dossier si besoin.

## Hors scope
- Pas de changement à `EventDossier` ni `ContractInvoiceManager`.
- Pas de modification des emails / clauses / numéros de BDC.
- Pas de migration BDD (colonnes déjà existantes).
