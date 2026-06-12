ALTER TABLE public.speaker_profiles
  ADD COLUMN IF NOT EXISTS rich_content jsonb,
  ADD COLUMN IF NOT EXISTS rich_content_updated_at timestamptz;