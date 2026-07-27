## Objectif

Faire apparaître le champ **Détails** du contrat (`event_description`) dans le mail « Communication conférencier », juste après la ligne Budget, sous forme de bullet point aligné sur le même style que les autres lignes.

## Constat

Dans `src/components/admin/EventDossier.tsx`, le générateur du corps d'email (`buildSpeakerEmailBody`) inclut déjà `contract.event_description`, mais :
- il est placé entre « Thématique » et « Client » (pas après Budget comme demandé) ;
- il n'existe pas dans le mail « contrat/BDC » envoyé au conférencier ;
- s'il n'apparaît pas dans le dossier Davido Consulting, c'est parce qu'un **brouillon d'email** a été sauvegardé précédemment (`events.speaker_info_email_body`) : à l'ouverture du dialog, le brouillon écrase le contenu régénéré.

## Modifications

### 1. Mail « Infos conférencier » (type `info`)

- Déplacer la ligne 📝 Détails juste **après** 💰 Budget (avant 🚗 Frais VHR), pour respecter l'ordre demandé :
  - 🏢 Client
  - 💰 Budget
  - 📝 Détails
  - 🚗 Frais VHR
- Utiliser le même helper `line(...)` que les autres champs pour un rendu homogène (paragraphe unique, label + valeur en gras). Le retour à la ligne éventuel dans `event_description` sera préservé via `.replace(/\n/g, "<br>")`.

### 2. Mail « Bon de commande conférencier » (type `contract`)

- Ajouter la même ligne 📝 Détails après 💰 Budget dans ce template (aujourd'hui absente).

### 3. Brouillons existants

Aucun écrasement automatique : les dossiers avec un brouillon déjà sauvegardé (ex. Davido Consulting) continueront d'afficher l'ancien texte. Pour bénéficier du nouveau format sur ces dossiers, il suffit de vider le champ email dans le dialog (bouton « Réinitialiser » si présent, ou effacer manuellement puis rouvrir) — les nouveaux dossiers auront directement le bon format.

## Fichiers touchés

- `src/components/admin/EventDossier.tsx` — fonction `buildSpeakerEmailBody` uniquement (2 templates, ~10 lignes réordonnées/ajoutées). Aucun changement de schéma, aucune donnée à migrer.
