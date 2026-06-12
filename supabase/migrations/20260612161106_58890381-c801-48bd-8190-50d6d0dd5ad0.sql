ALTER TABLE public.speaker_profiles
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS cta_button_label text DEFAULT 'Nous contacter',
  ADD COLUMN IF NOT EXISTS linked_profile_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_speaker_ids uuid[] NOT NULL DEFAULT '{}';