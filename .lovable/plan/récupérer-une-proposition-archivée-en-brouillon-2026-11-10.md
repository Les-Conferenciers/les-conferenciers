# Récupérer une proposition archivée en brouillon

## Ce qui change
- Dans l'onglet **Archivées** des propositions, chaque ligne a un bouton **« Remettre en brouillon »**.
- Après confirmation, la proposition passe dans l'onglet **Brouillons**, avec ses conférenciers, montants, message et notes internes. Vous pouvez la modifier puis la renvoyer comme d'habitude.
- La raison et la date d'archivage sont effacées, ainsi que les relances programmées. L'ancienne raison est recopiée dans les notes internes pour garder une trace (ex. « Archivée le 12/10/2026 – [Prix] trop cher »).
- Si la proposition a déjà un contrat ou un dossier événement, un message d'avertissement vous le signale avant de confirmer.
- Les versions anciennes d'une chaîne « mise à jour » ne sont pas concernées (elles restent rattachées à la version la plus récente).

## Détails techniques
- `src/pages/Admin.tsx` : dans `renderProposalRow`, bouton visible si `status === "archived"`. Handler `handleRestoreToDraft` : `update proposals set status='draft', lost_at=null, lost_reason=null, accepted_at=null, next_reminder_date=null, followup_reminder_date=null, internal_notes=<ancienne raison + notes>` puis `fetchProposals()` et bascule sur l'onglet Brouillons.
- Vérification préalable de l'existence d'un contrat/événement lié pour afficher l'avertissement.
