ALTER TABLE public.simulator_leads 
  ADD COLUMN lead_type text NOT NULL DEFAULT 'Simulateur',
  ADD COLUMN company text NULL,
  ADD COLUMN phone text NULL,
  ADD COLUMN event_date text NULL,
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET DEFAULT '';