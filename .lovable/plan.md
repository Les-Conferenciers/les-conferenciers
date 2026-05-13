# Plan d'évolutions Admin

Travail en 3 blocs. Confirme-moi avant que je lance.

## 1. Propositions

- **Date dans l'email** : formater `event_date_text` en français (15 septembre 2026) au lieu de l'ISO brut, partout où il apparaît dans les corps d'email générés (proposition initiale + relances).
- **Conférencier unique** : ajouter dans le template du mail "unique" la phrase  
  *"À ce titre, pourriez-vous m'indiquer la taille de l'auditoire envisagé ainsi que l'enveloppe budgétaire disponible ?"*  
  juste après la phrase sur les autres intervenants.
- **Verrouillage après envoi** : si `status` ≠ `draft`, le formulaire passe en lecture seule (champs disabled, suppression des boutons "Enregistrer brouillon" et "Envoyer"), avec un bandeau "Proposition envoyée le …".
- **Renvoyer une nouvelle proposition** : nouveau bouton "Nouvelle proposition pour ce client" qui duplique la proposition (client pré-rempli, conférenciers vides) en `draft`, avec un wording d'email adapté du type *"Suite à nos échanges, voici une nouvelle proposition…"*.
- **Archivage avec raison** : dialog obligatoire demandant la raison (champ libre + select : prix, date, profil, autre). Stockée dans `lost_reason`, `lost_at`. Notes et tâches conservées et consultables même en statut archivé/perdu.
- **Stop relances** : les jobs de relance (`send-proposal-reminder`, tâches J+7/J+14) ignorent les propositions `lost`/`archived`.

## 2. Contrats

- **Email auto à Nelly à la signature** : edge function `send-contract-email` (ou nouvelle `notify-contract-signed`) déclenchée quand `contracts.status` passe à `signed`, envoyée à `nellysabde@lesconferenciers.com`.
- **Infos client éditables à la création du contrat** : dans le dialog de création/édition contrat, ajouter section "Informations client" (adresse, code postal, ville, SIRET/RCS, téléphone, email contact) qui met à jour la table `clients` en plus du contrat.
- **CRM : autofill depuis les leads** : quand on remplit/édite une fiche client via email, pré-remplir nom contact, téléphone, société depuis le dernier lead correspondant (`simulator_leads.email`).
- **Aperçu contrat client** : retirer le bandeau "08 mai 2026 · 14h 📍PSG 🎤 Conférence" et la mention "J-156" sur `ContractView.tsx`.
- **Bouton Modifier sur l'aperçu contrat** : comme la feuille de liaison, ajouter un bouton "Modifier" qui rouvre le dialog d'édition, et garantit que les modifs persistent en base.
- **Onglet Contrats allégé** : supprimer les blocs "Prochains événements" et "À traiter cette semaine" en haut.

## 3. Feuille de liaison

- **Un seul onglet "Besoins logistiques"** : fusion des onglets "Technique" et "Détails techniques".
- **Pré-remplissage** :
  - besoins techniques : *"vidéoprojecteur, micro casque"*
  - commentaire : *"L'intervenant participera avec plaisir au déjeuner à l'issue de sa conférence."*
- **Bloc contacts** :
  - afficher numéros de téléphone après les noms (conférencier + client)
  - pour le client, afficher le nom du **contact** (pas la société)
  - rendre les champs contact éditables directement dans la feuille de liaison
- **Email client** (sans CC conférencier) : remplacer le wording actuel par le nouveau texte fourni, signé "Nelly Sabde – Les Conférenciers".
- **Email conférencier** :
  - tutoiement automatique si `speakers.formal_address = false`
  - objet inclut la date de l'événement (ex : *"Feuille de liaison – 15 septembre 2026"*)
- **Confidentialité** : ne pas afficher l'adresse email du client dans la feuille de liaison rendue.

## Détails techniques (interne)

- Frontend : `AdminProposals.tsx`, `EventDossier.tsx`, `ContractInvoiceManager.tsx`, `ContractView.tsx`, `LiaisonSheetView.tsx`, `AdminClients.tsx`.
- Backend : `send-proposal-email`, `send-proposal-reminder`, `send-contract-email` (ajout), `daily-task-recap` (filtrage `lost`).
- Migration : ajouter colonnes manquantes si besoin sur `proposals` (`lost_reason` existe déjà, ✓), sur `events` (`tech_needs`/`logistics_info` existent ✓, on fusionne côté UI).

Ok pour que je lance les 3 blocs d'un coup ?
