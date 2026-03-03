
-- Allow authenticated users to delete speakers
CREATE POLICY "Authenticated users can delete speakers"
ON public.speakers
FOR DELETE
TO authenticated
USING (true);
