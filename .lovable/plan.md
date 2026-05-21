## Objectif

Reproduire dans la feuille de liaison (`EventDossier.tsx`) le pattern déjà utilisé pour les emails visio (`AdminEventDossiers.tsx`) :
- Deux envois indépendants (client et conférencier) avec un bouton par onglet
- Date d'envoi mémorisée séparément pour chaque destinataire
- Le bouton d'envoi est grisé et remplacé par la date d'envoi côté déjà envoyé
- L'autre côté reste envoyable tant que son email n'est pas parti

## Changements

### 1. Base de données (migration)
Ajouter deux colonnes à la table `events` :
- `liaison_email_client_sent_at` (timestamptz, nullable)
- `liaison_email_speaker_sent_at` (timestamptz, nullable)

La colonne existante `liaison_sheet_sent_at` est conservée pour la rétro-compatibilité (affichage "Envoyée le…" et tracking jalon). Elle sera mise à jour dès qu'au moins un des deux emails est parti.

### 2. `src/components/admin/EventDossier.tsx`

- Type `EventData` : ajouter les deux nouveaux champs.
- Remplacer la fonction unique `handleSendLiaisonSheet` par deux handlers indépendants : `handleSendLiaisonToClient` et `handleSendLiaisonToSpeaker`. Chacun :
  - persiste les champs de la feuille (`persistLiaisonFields`)
  - valide les emails de son côté uniquement
  - envoie via `send-contact-email`
  - met à jour la colonne `liaison_email_*_sent_at` correspondante
  - met à jour `liaison_sheet_sent_at` si null
  - rafraîchit les données (le dialog reste ouvert pour permettre l'autre envoi)
- Dans le dialog (autour des lignes 2090-2145), pour chaque onglet (`client` / `speaker`) :
  - Afficher une coche verte à côté du label de l'onglet si déjà envoyé (comme pour la visio)
  - Si `liaison_email_client_sent_at` / `liaison_email_speaker_sent_at` est défini : afficher un encart "Email client/conférencier envoyé le {date}" et masquer/désactiver le bouton d'envoi
  - Sinon : afficher le bouton "Envoyer au client" / "Envoyer au conférencier" qui appelle le bon handler
- Le bouton global "Envoyer" actuel en bas du dialog est supprimé, remplacé par un bouton par onglet (le bouton "Fermer" reste).
- Le bouton "Renvoyer" sur la carte (ligne 1468) conserve son comportement : il ouvre le dialog. Les deux côtés peuvent être renvoyés individuellement après réouverture (en effaçant la date via un petit bouton "Renvoyer" à côté de l'encart "envoyé le…", optionnel — par défaut pas de réenvoi tant que la date est posée, comme demandé).

## Hors scope
- Aucun changement sur le contenu des emails ni sur les templates
- Aucun changement sur la page `LiaisonSheetView.tsx`
- Aucun changement sur le pattern visio existant
