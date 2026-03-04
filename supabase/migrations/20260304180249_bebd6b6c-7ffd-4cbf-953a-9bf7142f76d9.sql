CREATE TABLE public.google_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_photo_url text,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  review_date text,
  relative_time text,
  avatar_color text DEFAULT '#4285F4',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for google_reviews" ON public.google_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage google_reviews" ON public.google_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);