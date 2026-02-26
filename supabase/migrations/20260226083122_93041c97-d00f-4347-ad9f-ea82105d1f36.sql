
-- Create simulator_leads table
CREATE TABLE public.simulator_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  event_type text,
  audience_size text,
  themes text[],
  objective text,
  budget text,
  location text,
  additional_info text,
  suggested_speakers text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public insert (anyone can submit the form)
ALTER TABLE public.simulator_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads"
ON public.simulator_leads
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (admins) can read
CREATE POLICY "Authenticated users can read leads"
ON public.simulator_leads
FOR SELECT
TO authenticated
USING (true);
