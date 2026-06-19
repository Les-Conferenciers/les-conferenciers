ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS next_reminder_date date,
  ADD COLUMN IF NOT EXISTS next_reminder_note text,
  ADD COLUMN IF NOT EXISTS followup_reminder_date date,
  ADD COLUMN IF NOT EXISTS followup_reminder_note text;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS cc_emails text[] DEFAULT '{}'::text[];