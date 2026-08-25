# Renvoi de la feuille de liaison + demande initiale du client dans les dossiers

## 1. Renvoyer la feuille de liaison après modification

Aujourd'hui, dès qu'un email de feuille de liaison est envoyé (client ou conférencier), l'onglet correspondant se verrouille et n'affiche plus qu'un bandeau vert « Email envoyé le … ». Impossible de renvoyer une version corrigée.

Nouveau comportement, indépendamment pour l'onglet Client et l'onglet Conférencier :

- Le bandeau vert reste, avec en plus un bouton « Modifier et renvoyer ».
- Ce bouton rouvre le formulaire complet (destinataires, CC, objet, corps) pré-rempli avec le dernier contenu enregistré, et le bouton d'envoi devient « Renvoyer au client » / « Renvoyer au conférencier ».
- Après renvoi, le bandeau affiche : « Envoyée le 12 mars · Renvoyée le 18 mars (2 envois) ». La date du premier envoi n'est jamais écrasée.
- Le jalon « Feuille de liaison » du pipeline reste validé (il ne repasse pas en attente).

## 2. Conserver la demande initiale du client dans le dossier

La demande d'origine arrive via le formulaire du site / le simulateur et est stockée dans les Leads. Quand une proposition est créée depuis un lead, le contenu du lead est aujourd'hui recopié partiellement dans le champ « message » de la proposition, et le lien vers le lead est perdu — on ne peut plus retrouver le texte exact du client (utile notamment pour les demandes en anglais), a fortiori quand le dossier est archivé.

Nouveau comportement :

- La proposition mémorise le lead d'origine lorsqu'elle est créée depuis la fiche lead.
- Dans le dossier (onglet Contrats, y compris pour les dossiers archivés gagnés/perdus), un bloc repliable « 📩 Demande initiale du client » affiche : date de réception, nom/société/email/téléphone, et le message brut du client tel qu'il a été reçu, plus les infos du formulaire (type d'événement, thématiques, budget, lieu, date, audience).
- Pour les dossiers déjà existants sans lien enregistré, le bloc retrouve automatiquement le lead correspondant par email (le plus récent antérieur à la proposition). À défaut de lead, il affiche le message saisi sur la proposition.
- Le bloc est en lecture seule et reste accessible même si le lead est ancien.

## Détails techniques

- Base de données (migration) :
  - `events` : ajout de `liaison_email_client_last_sent_at` et `liaison_email_speaker_last_sent_at` (timestamptz) + `liaison_email_client_send_count` / `liaison_email_speaker_send_count` (integer, défaut 0).
  - `proposals` : ajout de `lead_id` (uuid, référence `simulator_leads`, nullable, `ON DELETE SET NULL`).
- `src/components/admin/EventDossier.tsx` :
  - état `liaisonResendMode` par cible ; `handleSendLiaisonEmail` renseigne `*_sent_at` au premier envoi puis `*_last_sent_at` et incrémente le compteur aux suivants.
  - nouveau composant/section « Demande initiale du client » chargée depuis `simulator_leads` (par `proposals.lead_id`, sinon fallback `ilike` sur l'email client).
- `src/components/admin/AdminLeads.tsx` : le brouillon `pendingProposalDraft` transporte `leadId`.
- `src/pages/AdminProposals.tsx` : `lead_id` enregistré à l'insertion de la proposition.
