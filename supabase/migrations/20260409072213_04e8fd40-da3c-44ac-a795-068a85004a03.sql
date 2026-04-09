ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS event_location text,
  ADD COLUMN IF NOT EXISTS event_date_text text,
  ADD COLUMN IF NOT EXISTS audience_size text,
  ADD COLUMN IF NOT EXISTS client_phone text;