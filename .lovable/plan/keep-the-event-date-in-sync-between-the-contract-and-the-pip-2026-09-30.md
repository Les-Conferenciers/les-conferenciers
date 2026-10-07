# Keep the event date in sync between the contract and the pipeline

## Diagnosis (confirmed)
The date is stored in two places: in the contract, and in the event file. The pipeline shows the event file's date first. When you change the date in the contract, only the contract gets updated, so the pipeline keeps the old date.
GMBA: contract = 15/10/2026, event file = 15/09/2026.

Only 2 other files have different dates:
- FFDM: contract 01/06/2028, file 03/06/2027
- SAFRAN: contract 15/09/2026, file 16/09/2026

## Fix
1. **Automatic sync both ways**: when the date changes on the contract that is in force, the event file (pipeline) is updated. When it changes in the event file (edit or liaison sheet), the contract in force is updated too. This works no matter which screen you edit it from.
2. **Correct the existing files**: the contract date wins for GMBA, FFDM and SAFRAN. Files with no date of their own keep showing the contract date, as they do today.
3. The pipeline shows the contract date first, then the event file date if there is no contract date.

## Technical details
- Migration: two triggers, AFTER UPDATE OF event_date. On `contracts` (only where `superseded_at IS NULL`), update `events` for the same proposal_id. On `events`, update the active contract. Both use `IS DISTINCT FROM`, so they can't set each other off in a loop.
- Data fix via an UPDATE on `events` from the active contracts where the dates differ and the contract has a date.
- `AdminEventDossiers.tsx` line ~360: `pContract?.event_date || pEvent?.event_date`.
