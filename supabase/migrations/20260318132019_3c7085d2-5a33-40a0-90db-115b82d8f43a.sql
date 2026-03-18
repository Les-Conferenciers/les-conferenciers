
INSERT INTO storage.buckets (id, name, public)
VALUES ('speaker-videos', 'speaker-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read speaker videos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'speaker-videos');
CREATE POLICY "Auth upload speaker videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'speaker-videos');
CREATE POLICY "Auth update speaker videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'speaker-videos');
CREATE POLICY "Auth delete speaker videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'speaker-videos');
