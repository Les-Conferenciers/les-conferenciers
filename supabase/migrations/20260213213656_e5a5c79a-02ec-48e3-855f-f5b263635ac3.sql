
CREATE TABLE public.speaker_conferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  bullet_points TEXT[] DEFAULT '{}'::text[],
  bonus TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.speaker_conferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for speaker conferences"
  ON public.speaker_conferences FOR SELECT USING (true);

CREATE INDEX idx_speaker_conferences_speaker_id ON public.speaker_conferences(speaker_id);
