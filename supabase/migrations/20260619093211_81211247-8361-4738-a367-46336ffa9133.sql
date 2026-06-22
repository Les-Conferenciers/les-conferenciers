-- Item 2: Fix V2 contrat (autoriser plusieurs versions par proposal)
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_proposal_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS contracts_active_proposal_idx
  ON public.contracts(proposal_id) WHERE superseded_at IS NULL;

-- Item 1: Nouvelles colonnes relance (date unique + rappel agenda après 2e relance)
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS next_reminder_date date,
  ADD COLUMN IF NOT EXISTS next_reminder_note text,
  ADD COLUMN IF NOT EXISTS followup_reminder_date date,
  ADD COLUMN IF NOT EXISTS followup_reminder_note text;

-- Item 5: CC emails modifiables après envoi
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS cc_emails text[] DEFAULT '{}'::text[];