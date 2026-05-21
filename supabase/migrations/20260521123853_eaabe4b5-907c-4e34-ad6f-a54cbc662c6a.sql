ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS liaison_email_client_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS liaison_email_speaker_sent_at timestamptz;