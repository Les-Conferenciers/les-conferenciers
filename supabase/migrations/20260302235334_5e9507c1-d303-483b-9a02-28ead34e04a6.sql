-- Allow authenticated users to insert speakers
CREATE POLICY "Authenticated users can insert speakers"
ON public.speakers
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert speaker conferences
CREATE POLICY "Authenticated users can insert speaker_conferences"
ON public.speaker_conferences
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update speaker conferences
CREATE POLICY "Authenticated users can update speaker_conferences"
ON public.speaker_conferences
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete speaker conferences
CREATE POLICY "Authenticated users can delete speaker_conferences"
ON public.speaker_conferences
FOR DELETE TO authenticated
USING (true);