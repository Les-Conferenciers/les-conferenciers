
-- Add archived column to speakers
ALTER TABLE public.speakers ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Add author_title column to reviews (for position/role like "Directeur Délégué Ineo Infracom")
ALTER TABLE public.reviews ADD COLUMN author_title text;

-- Allow authenticated users to delete reviews (for CRM management)
CREATE POLICY "Authenticated users can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);

-- Allow authenticated users to update reviews (for CRM management)
CREATE POLICY "Authenticated users can update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
