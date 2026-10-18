# Entité à facturer : choix clair à la création d'une facture

Aujourd'hui, la fenêtre « Créer une facture » contient un bloc replié « Facturer à une autre entité (optionnel) » peu visible, sans téléphone.

## Ce qui change

Dans la fenêtre « Créer une facture » (et « Modifier » une facture), en haut, un choix à 2 options :

- **Facturer le client** (par défaut) : la facture est adressée au client du contrat, comme aujourd'hui.
- **Créer une entité à facturer** : affiche un formulaire avec
  - Nom de l'entité (obligatoire)
  - SIRET
  - Adresse mail
  - Téléphone
  - Adresse postale
  - N° TVA intra (conservé, facultatif)

Si l'option entité est choisie et le nom vide, la création est bloquée avec un message.

Sur la facture (back-office et lien client), le bloc destinataire affiche l'entité avec son téléphone, et la mention « Pour le compte de {client} » reste. L'adresse mail de l'entité reste le destinataire proposé par défaut à l'envoi.

La facture de solde reprend automatiquement l'entité utilisée sur l'acompte du même dossier (préremplie, modifiable).

## Détails techniques

- Migration : ajout de `invoices.billing_entity_phone text` (nullable).
- `ContractInvoiceManager.tsx` : RadioGroup `billingMode` ("client" | "entity") remplaçant le `<details>` ; champ téléphone dans `BillingEntity` ; en mode client, les champs `billing_entity_*` sont enregistrés à null ; en édition, le mode est déduit de `billing_entity_name` ; préremplissage depuis l'acompte du même dossier ; duplication/régénération copie aussi le téléphone.
- `InvoiceView.tsx` : affichage du téléphone ; `get_public_invoice` renvoie déjà toute la ligne facture, pas de changement serveur.
