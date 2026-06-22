## Simplification du bloc Relances après la 2e relance

### Comportement actuel
Après envoi de la Relance 2, deux blocs distincts apparaissent dans la fiche proposition (`src/pages/Admin.tsx`) :
- Le bloc "Relance prévue" (date + notes) qui reste affiché
- Un second bloc "Rappel agenda" (followup_reminder_date / followup_reminder_note)

### Comportement souhaité
Après envoi de la Relance 2, **un seul bloc** intitulé :

> 📅 Rappel agenda complémentaire (pas d'email envoyé)

Ce bloc contient :
- **Historique** (lecture seule) : les dates de Relance 1 et Relance 2 effectuées + les notes saisies précédemment (`next_reminder_note` figée au moment de l'envoi de R2)
- **Champs éditables** : une nouvelle date de rappel agenda + une note associée (réutilise `followup_reminder_date` / `followup_reminder_note`)

Aucun email n'est envoyé pour ce rappel — il alimente uniquement le récap quotidien à 9h (déjà câblé dans `daily-task-recap`).

### Modifications

1. **`src/pages/Admin.tsx`** — bloc d'affichage des relances :
   - Si `reminders_sent >= 2` : masquer le bloc "Relance prévue" actuel et n'afficher que le bloc unique "Rappel agenda complémentaire" avec :
     - Section historique : "Relance 1 envoyée le {date}", "Relance 2 envoyée le {date}", note figée (`next_reminder_note` si présente)
     - Champs éditables : `followup_reminder_date` (date picker) + `followup_reminder_note` (textarea)
   - Sinon (< 2 relances) : comportement actuel inchangé (un seul bloc "Relance prévue" éditable)

2. **Aucune migration SQL** nécessaire — les colonnes existent déjà (`next_reminder_date/note`, `followup_reminder_date/note`, `reminders_sent`, `last_reminder_at`).

3. **`daily-task-recap`** : déjà compatible (scanne `followup_reminder_date`), aucun changement.

### Détails techniques
- Le handler `saveTaskEdits` existant continue de persister les deux champs `followup_*`.
- L'historique de Relance 1/2 est reconstruit à partir de `reminders_sent` + `last_reminder_at` (pas d'historique fin par relance en base — on affichera "Dernière relance envoyée le {last_reminder_at}" + le compteur).
