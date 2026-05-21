# Emails de confirmation visio (client + conférencier)

## Objectif

Sur l'étape **Visio** du suivi contrat, ajouter un dialog permettant d'envoyer deux emails distincts (client / conférencier) confirmant la visio préparatoire, sur le même modèle d'UX que la feuille de liaison (deux onglets, éditeur, To/CC, sujet, corps modifiable).

## UX (calquée sur la feuille de liaison)

Bouton **« Envoyer les invitations »** dans le bloc Visio de `EventDossier.tsx` (à côté du quick picker date/heure existant), ouvrant un Dialog :

- Onglets `Client` / `Conférencier`
- Champs éditables : `À`, `Cc`, `Objet`, `Corps` (Textarea)
- Pré-remplissage automatique depuis l'événement (date, heure, contact, conférencier)
- Boutons : `Annuler` / `Envoyer client` / `Envoyer conférencier` (envoi indépendant par onglet, comme la liaison)
- Tracking : nouvelle colonne `visio_emails_sent_at` (timestamp) — affichée comme "Invitations envoyées le …" sous le bloc visio

## Templates pré-remplis

**Variables** : `[date de l'événement]` = `event_date` formaté FR long (ex. « 29 mai 2026 »), `[heure de l'evenement]` = `visio_time`.

**Client** (objet : `Invitation visio préparatoire — [date]`) :
```
Bonjour,

Suite à nos précédents échanges, l'invitation teams pour la visio du [date] à [heure] vient de vous être adressée.

Dans l'attente de nos prochains échanges, je vous souhaite une excellente fin de journée !
```

**Conférencier** (objet : `Invitation visio préparatoire — [date]`, tutoiement/vouvoiement selon `speakers.formal_address`) :
```
Bonjour,

Suite à nos précédents échanges, l'invitation teams pour la visio du [date] à [heure] vient de partir.

A très vite et belle journée
```

> Note : ce sont des emails de notification — l'invitation Teams elle-même reste envoyée manuellement par Nelly depuis Outlook/Teams (le mail confirme juste son envoi).

## Implémentation technique

**Fichiers modifiés**
- `src/components/admin/EventDossier.tsx` : nouveaux states `visioEmail*` (mêmes patterns que `liaison*`), fonction `openVisioEmailDialog()` pré-remplissant les champs, `handleSendVisioEmail(target: 'client'|'speaker')` qui appelle l'edge function existante d'envoi puis upsert `events.visio_emails_sent_at = now()`.

**Edge function**
- Réutilise `send-contact-email` ou créer un endpoint générique léger. Plus simple : réutiliser le même mécanisme que la feuille de liaison (vérifier quelle fonction elle utilise — probablement Resend via une edge function existante). Aucun nouveau secret nécessaire.

**Migration SQL**
```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visio_emails_sent_at timestamptz;
```

**Expéditeur** : `nellysabde@lesconferenciers.com` (memory: sender-identity).

## Hors scope
- Pas de génération d'invitation .ics ni d'intégration Teams API (envoi manuel par Nelly inchangé).
- Pas de modification du quick picker date/heure existant.
