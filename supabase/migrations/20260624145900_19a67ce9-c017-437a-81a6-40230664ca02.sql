ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS speaker_info_email_subject text,
  ADD COLUMN IF NOT EXISTS speaker_info_email_body text,
  ADD COLUMN IF NOT EXISTS speaker_info_email_cc text,
  ADD COLUMN IF NOT EXISTS speaker_contract_email_subject text,
  ADD COLUMN IF NOT EXISTS speaker_contract_email_body text,
  ADD COLUMN IF NOT EXISTS speaker_contract_email_cc text;