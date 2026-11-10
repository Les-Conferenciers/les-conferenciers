ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS initial_request jsonb;
UPDATE public.proposals p SET initial_request = to_jsonb(l) FROM public.simulator_leads l WHERE p.lead_id = l.id AND p.initial_request IS NULL;
UPDATE public.proposals p SET initial_request = (
  SELECT to_jsonb(l) FROM public.simulator_leads l WHERE lower(l.email) = lower(p.client_email) ORDER BY l.created_at DESC LIMIT 1)
WHERE p.initial_request IS NULL AND p.client_email IS NOT NULL;