## 1. Champs « Lieu » et « Horaires » trop courts (édition du contrat)

`src/pages/ContractView.tsx` lignes 296–306 : les `<input>` ont `min-w-[260px]` / `min-w-[200px]`, insuffisant pour une adresse complète ou un horaire détaillé.

→ Élargir : `w-full max-w-[640px]` pour le lieu, `w-full max-w-[420px]` pour les horaires (toujours dans la même ligne, mais largeur fluide jusqu'à la marge du conteneur).

## 2. Thématique et Détails uniquement s'ils sont renseignés (édition incluse)

Toujours `ContractView.tsx`, lignes 315–330. Aujourd'hui en mode édition ces deux champs sont toujours visibles ; on veut qu'ils n'apparaissent **que** s'ils contiennent quelque chose.

→ Modifier :
- Retirer la condition `editing ||` : n'afficher la ligne « Thématique » que si `event?.theme` a une valeur ; idem « Détails » uniquement si `contract.event_description` a une valeur.
- En mode édition, ajouter deux petits boutons « + Ajouter thématique » / « + Ajouter détails » sous le bloc, visibles uniquement quand le champ correspondant est vide. Cliquer place une chaîne vide initiale dans le state local (et donc fait apparaître l'input correspondant).
- Le rendu non-édition est déjà conforme : aucun changement visible côté client final.

## 3. Enregistrer le mail du contrat sans l'envoyer

Aujourd'hui (`ContractInvoiceManager.tsx`, dialog lignes 848–887) : un seul bouton « Envoyer le contrat par email ». Objet et corps ne sont jamais persistés — toute modification est perdue à la fermeture du dialog.

### Schéma DB

Migration : ajouter deux colonnes optionnelles sur `contracts` :
- `email_subject text`
- `email_body text`

### UI

Dans le dialog « Envoyer le contrat » :
- À l'ouverture (`openContractEmail`) : si `contract.email_subject` / `contract.email_body` existent, les pré-remplir avec ces valeurs ; sinon utiliser les valeurs par défaut générées actuellement.
- Ajouter un bouton secondaire **« Enregistrer le brouillon »** à gauche du bouton d'envoi. Il fait `update contracts set email_subject, email_body where id=...`, affiche un toast « Brouillon enregistré » et ferme le dialog **sans changer `status`** (le contrat reste `draft` ou son statut courant).
- Le bouton « Envoyer le contrat par email » continue de fonctionner comme aujourd'hui (envoi + passage à `status='sent'`), en sauvegardant aussi les valeurs courantes des champs en base avant l'invocation de l'edge function, pour que la prochaine ouverture retrouve le dernier état.

### Types

Mettre à jour le type local `ContractRow` dans `ContractInvoiceManager.tsx` (lignes ~40–60) pour inclure les deux nouveaux champs ; les types Supabase régénérés couvriront le reste.

## Hors scope

- Pas de modification de l'edge function `send-contract-email` : elle reçoit déjà `email_subject` et `email_body` dans le body.
- Pas de changement du flow d'invoice / facture.
- Pas de modification de la page `SpeakerContractView` (contrat conférencier).
