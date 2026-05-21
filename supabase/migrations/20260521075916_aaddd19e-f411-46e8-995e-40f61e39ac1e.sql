ALTER TABLE public.proposal_tasks ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE public.proposals ALTER COLUMN expires_at SET DEFAULT (now() + interval '90 days');