ALTER TABLE public.simulator_leads
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS confirmation_message_id text;