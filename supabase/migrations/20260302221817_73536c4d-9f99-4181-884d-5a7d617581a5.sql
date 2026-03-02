-- Create a public bucket for speaker photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('speaker-photos', 'speaker-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Speaker photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'speaker-photos');

-- Allow authenticated users to upload/update
CREATE POLICY "Authenticated users can upload speaker photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'speaker-photos');

CREATE POLICY "Authenticated users can update speaker photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'speaker-photos');

CREATE POLICY "Authenticated users can delete speaker photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'speaker-photos');