
CREATE TABLE public.page_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_faqs TO authenticated;
GRANT ALL ON public.page_faqs TO service_role;

ALTER TABLE public.page_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read page faqs" ON public.page_faqs FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert page faqs" ON public.page_faqs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update page faqs" ON public.page_faqs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete page faqs" ON public.page_faqs FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.page_faqs_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER page_faqs_set_updated_at
BEFORE UPDATE ON public.page_faqs
FOR EACH ROW EXECUTE FUNCTION public.page_faqs_set_updated_at();
