ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS custom_clauses jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deposit_required boolean NOT NULL DEFAULT true;

ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS internal_category text;