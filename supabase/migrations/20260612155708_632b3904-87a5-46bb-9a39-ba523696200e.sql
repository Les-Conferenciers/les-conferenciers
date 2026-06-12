
CREATE TABLE public.speaker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  landing_label text NOT NULL,
  landing_enabled boolean NOT NULL DEFAULT false,
  seo_title text,
  meta_description text,
  intro_html text,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.speaker_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaker_profiles TO authenticated;
GRANT ALL ON public.speaker_profiles TO service_role;

ALTER TABLE public.speaker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read profiles" ON public.speaker_profiles FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert profiles" ON public.speaker_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update profiles" ON public.speaker_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete profiles" ON public.speaker_profiles FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.speaker_profiles_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_speaker_profiles_updated_at
BEFORE UPDATE ON public.speaker_profiles
FOR EACH ROW EXECUTE FUNCTION public.speaker_profiles_set_updated_at();

ALTER TABLE public.speakers
  ADD COLUMN profile_id uuid REFERENCES public.speaker_profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_speakers_profile_id ON public.speakers(profile_id);

INSERT INTO public.speaker_profiles (slug, name, landing_label, landing_enabled, display_order) VALUES
  ('anciens-du-gign', 'Anciens du GIGN', 'Conférenciers anciens du GIGN', true, 10),
  ('astronautes', 'Astronautes', 'Conférenciers astronautes', true, 20),
  ('navigateurs', 'Navigateurs', 'Conférenciers navigateurs', true, 30),
  ('rugbymen', 'Rugbymen', 'Conférenciers rugbymen', true, 40),
  ('experts-ia', 'Experts IA', 'Conférenciers experts en intelligence artificielle', true, 50),
  ('economistes', 'Économistes', 'Conférenciers économistes', true, 60),
  ('philosophes', 'Philosophes', 'Conférenciers philosophes', true, 70),
  ('artistes', 'Artistes', 'Conférenciers artistes', false, 80),
  ('chefs-entreprise', 'Chefs d''entreprise', 'Conférenciers chefs d''entreprise', false, 90),
  ('sportifs-haut-niveau', 'Sportifs de haut niveau', 'Conférenciers sportifs de haut niveau', false, 100),
  ('aventuriers-explorateurs', 'Aventuriers / Explorateurs', 'Conférenciers aventuriers et explorateurs', false, 110),
  ('chefs-cuisiniers', 'Chefs cuisiniers', 'Conférenciers chefs cuisiniers', false, 120),
  ('journalistes', 'Journalistes', 'Conférenciers journalistes', false, 130),
  ('scientifiques', 'Scientifiques', 'Conférenciers scientifiques', false, 140),
  ('militaires', 'Militaires', 'Conférenciers militaires', false, 150),
  ('medecins', 'Médecins', 'Conférenciers médecins', false, 160);
