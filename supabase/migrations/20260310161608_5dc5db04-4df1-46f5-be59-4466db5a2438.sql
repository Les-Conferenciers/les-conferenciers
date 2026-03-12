
ALTER TABLE public.proposals ADD COLUMN recipient_name text;

ALTER TABLE public.proposal_speakers ADD COLUMN selected_conference_ids uuid[] DEFAULT '{}'::uuid[];
