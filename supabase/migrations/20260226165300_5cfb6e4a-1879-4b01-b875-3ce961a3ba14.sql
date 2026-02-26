-- Restrict public read to non-expired proposals only
DROP POLICY "Public can read proposals by token" ON public.proposals;
CREATE POLICY "Public can read non-expired proposals"
  ON public.proposals FOR SELECT TO anon
  USING (expires_at > now());

-- Restrict public read of proposal_speakers to those belonging to non-expired proposals
DROP POLICY "Public can read proposal_speakers" ON public.proposal_speakers;
CREATE POLICY "Public can read proposal_speakers for valid proposals"
  ON public.proposal_speakers FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.expires_at > now()
  ));
