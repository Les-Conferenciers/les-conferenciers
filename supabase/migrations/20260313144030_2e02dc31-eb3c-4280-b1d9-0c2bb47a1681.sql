
ALTER TABLE public.contracts 
  ADD COLUMN contract_lines jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN discount_percent numeric DEFAULT 0;
