
-- 1. Add formal_address to speakers (true = vouvoiement, false = tutoiement)
ALTER TABLE public.speakers ADD COLUMN IF NOT EXISTS formal_address boolean DEFAULT true;

-- 2. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  siret text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage clients" ON public.clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read clients" ON public.clients
  FOR SELECT TO public USING (true);

-- 3. Add client_id to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);

-- 4. Create events table (dossier événement)
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  bdc_number text,
  audience_size text,
  theme text,
  speaker_budget numeric,
  info_sent_speaker_at timestamp with time zone,
  contract_sent_speaker_at timestamp with time zone,
  visio_date date,
  visio_time text,
  visio_notes text,
  liaison_sheet_sent_at timestamp with time zone,
  speaker_paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(proposal_id)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage events" ON public.events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Add reminder tracking to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS reminder1_sent_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS reminder2_sent_at timestamp with time zone;
