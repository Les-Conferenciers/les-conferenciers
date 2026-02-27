-- Drop old restrictive policies
DROP POLICY IF EXISTS "Public can read non-expired proposals" ON proposals;
DROP POLICY IF EXISTS "Public can read proposal_speakers for valid proposals" ON proposal_speakers;

-- Public can read non-expired proposals
CREATE POLICY "Public can read non-expired proposals" ON proposals
  FOR SELECT USING (
    expires_at > now() OR auth.role() = 'authenticated'
  );

-- Public can read proposal_speakers for valid or admin proposals
CREATE POLICY "Public can read proposal_speakers for valid proposals" ON proposal_speakers
  FOR SELECT USING (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_speakers.proposal_id AND p.expires_at > now()
    )
  );