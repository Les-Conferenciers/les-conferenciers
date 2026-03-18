
ALTER TABLE public.speakers ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 999;
ALTER TABLE public.speakers ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT NULL;
