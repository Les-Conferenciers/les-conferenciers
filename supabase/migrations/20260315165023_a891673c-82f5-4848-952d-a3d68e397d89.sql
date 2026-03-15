
CREATE TABLE public.proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  speaker_ids uuid[] NOT NULL DEFAULT '{}',
  is_preset boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage proposal_templates"
  ON public.proposal_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public read proposal_templates"
  ON public.proposal_templates FOR SELECT TO public
  USING (true);

-- Insert preset templates
INSERT INTO public.proposal_templates (name, is_preset, speaker_ids) VALUES
  ('Patrouille de France', true, ARRAY(SELECT id FROM public.speakers WHERE LOWER(name) IN ('virginie guyot') OR themes::text ILIKE '%patrouille%' OR biography ILIKE '%patrouille de france%' LIMIT 10)),
  ('GIGN / RAID', true, ARRAY(SELECT id FROM public.speakers WHERE themes::text ILIKE '%gign%' OR themes::text ILIKE '%raid%' OR biography ILIKE '%gign%' OR biography ILIKE '%raid%' OR biography ILIKE '%forces spéciales%' LIMIT 10)),
  ('Chefs d''orchestre', true, ARRAY(SELECT id FROM public.speakers WHERE themes::text ILIKE '%orchestre%' OR biography ILIKE '%orchestre%' OR biography ILIKE '%chef d''orchestre%' OR specialty ILIKE '%orchestre%' LIMIT 10));
