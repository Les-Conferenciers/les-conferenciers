# No more reminders on archived proposals

## Problem
When a proposal is archived (manually, automatically after the follow-ups, or because it was replaced by a new version), its reminders are kept: reminder date, extra agenda reminder, and pending follow-ups R1/R2. Today there are **168 pending follow-ups** and about ten reminder dates attached to archived proposals.

## What changes
- As soon as a proposal is archived, however it got there, it automatically loses:
  - its reminder date;
  - its extra agenda reminder;
  - its pending follow-ups (they are marked « annulée », not deleted, so the history is kept).
- Reminders remain only on the active version (the new one).
- If an archived proposal is put back into draft, you can set its reminders again.
- One-off cleanup: proposals that are already archived lose their current reminders. This includes ORANO and LEROY MERLIN (agenda reminder on 7 December), and the old versions of Innocent, CNP, Convergence, etc.
- The 7 a.m. recap email already ignored archived proposals; that does not change.

## Technical details
- Migration: trigger `BEFORE UPDATE OF status ON proposals`. When `NEW.status IN ('archived','lost')` and the old status differs, it sets `next_reminder_date`/`followup_reminder_date` (and their notes) to null. An `AFTER` trigger sets `proposal_tasks` from `pending` to `cancelled`. This covers the Admin, auto-archive-proposals and « mise à jour » paths with no code duplication.
- One-off data update on existing archived proposals (same rules).
- `Admin.tsx`: the R1/R2 badge and the task lists ignore proposals whose status is `archived`, as a safety net.
