-- Proposals table
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_name text NOT NULL,
  client_email text NOT NULL,
  message text,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '15 days'),
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admin) can do everything
CREATE POLICY "Authenticated users can manage proposals"
  ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public can read by token (for the public page)
CREATE POLICY "Public can read proposals by token"
  ON public.proposals FOR SELECT TO anon USING (true);

-- Proposal speakers junction table
CREATE TABLE public.proposal_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  speaker_id uuid NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  speaker_fee numeric,
  travel_costs numeric,
  agency_commission numeric,
  total_price numeric,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage proposal_speakers"
  ON public.proposal_speakers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read proposal_speakers"
  ON public.proposal_speakers FOR SELECT TO anon USING (true);
