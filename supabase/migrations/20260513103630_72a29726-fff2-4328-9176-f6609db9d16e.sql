-- Unique partial index on bdc_number (when present)
CREATE UNIQUE INDEX IF NOT EXISTS events_bdc_number_unique 
  ON public.events (bdc_number) 
  WHERE bdc_number IS NOT NULL AND bdc_number <> '';