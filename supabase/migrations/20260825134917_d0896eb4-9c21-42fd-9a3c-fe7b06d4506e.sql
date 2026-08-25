ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS liaison_email_client_last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS liaison_email_speaker_last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS liaison_email_client_send_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liaison_email_speaker_send_count integer NOT NULL DEFAULT 0;

UPDATE public.events SET liaison_email_client_send_count = 1 WHERE liaison_email_client_sent_at IS NOT NULL AND liaison_email_client_send_count = 0;
UPDATE public.events SET liaison_email_speaker_send_count = 1 WHERE liaison_email_speaker_sent_at IS NOT NULL AND liaison_email_speaker_send_count = 0;

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.simulator_leads(id) ON DELETE SET NULL;