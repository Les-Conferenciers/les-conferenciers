# Copie (CC) sur les relances de propositions

## Objectif
Pouvoir ajouter un ou plusieurs destinataires en copie lors de l'envoi d'une relance (Relance 1 et Relance 2) depuis l'onglet Propositions commerciales.

## Ce qui change

1. **Champ « Copie (CC) » dans la fenêtre de relance**
   - Ajouté sous l'objet, dans le bloc « Envoyer une relance ».
   - Accepte plusieurs adresses séparées par des virgules.
   - Pré-rempli automatiquement avec le CC déjà enregistré sur la proposition (`email_cc`), modifiable avant chaque envoi.

2. **Envoi réel en copie**
   - Le CC saisi est transmis à la fonction d'envoi et ajouté au champ `cc` de l'email.
   - Fonctionne identiquement pour Relance 1 et Relance 2.

3. **Mémorisation**
   - Le CC utilisé est enregistré sur la proposition, pour être repris par défaut à la relance suivante.

## Détails techniques

- `src/pages/Admin.tsx` :
  - nouvel état `reminderCc`, initialisé à `proposal.email_cc` à l'ouverture du dialogue de relance ;
  - champ `Input` « Copie (CC) » ;
  - `handleReminder(...)` reçoit un paramètre `cc` et le passe dans le body de `supabase.functions.invoke("send-proposal-reminder")` ;
  - mise à jour de `email_cc` sur la proposition en même temps que `reminder1_sent_at` / `reminder2_sent_at`.
- `supabase/functions/send-proposal-reminder/index.ts` :
  - lecture de `cc` dans le body, fallback sur `proposal.email_cc` ;
  - découpage sur virgules/points-virgules, nettoyage et validation basique des adresses ;
  - ajout de `cc: [...]` au payload Resend si non vide.
- Aucune migration de base nécessaire (`proposals.email_cc` existe déjà).

## Vérification
Envoyer une relance test avec une adresse en copie et confirmer la réception sur les deux boîtes.
