
-- 1) Bucket signed-contracts: limit to 50 MB
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'signed-contracts';

-- 2) Add notes column on invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes text;

-- 3) Add speaker contact fields on events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS speaker_contact_name text,
  ADD COLUMN IF NOT EXISTS speaker_contact_phone text,
  ADD COLUMN IF NOT EXISTS speaker_contact_email text;

-- 4) New invoice numbering function: DDMM-<BDC> based on event date + BDC number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_proposal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev_date date;
  bdc text;
  bdc_clean text;
  next_num integer;
BEGIN
  SELECT e.event_date, e.bdc_number
    INTO ev_date, bdc
  FROM public.events e
  WHERE e.proposal_id = _proposal_id
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  IF ev_date IS NOT NULL AND bdc IS NOT NULL AND length(bdc) > 0 THEN
    -- strip 'BDC-' prefix if present
    bdc_clean := regexp_replace(bdc, '^BDC[- ]*', '', 'i');
    RETURN to_char(ev_date, 'DDMM') || '-' || bdc_clean;
  END IF;

  -- Fallback: YYYYMMDD-XX (no clash with previous FAC- numbers)
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS integer)), 0) + 1
    INTO next_num
  FROM public.invoices
  WHERE invoice_number LIKE to_char(now(), 'YYYYMMDD') || '-%';

  RETURN to_char(now(), 'YYYYMMDD') || '-' || lpad(next_num::text, 2, '0');
END;
$$;

-- 5) Replace trigger function to pass proposal_id
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number(NEW.proposal_id);
  END IF;
  RETURN NEW;
END;
$$;

-- ensure trigger exists
DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.invoices;
CREATE TRIGGER trg_set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

-- 6) Rétro-renumérotation : toutes les factures existantes
UPDATE public.invoices i
SET invoice_number = sub.new_number
FROM (
  SELECT i2.id,
    CASE
      WHEN e.event_date IS NOT NULL AND e.bdc_number IS NOT NULL AND length(e.bdc_number) > 0
        THEN to_char(e.event_date, 'DDMM') || '-' || regexp_replace(e.bdc_number, '^BDC[- ]*', '', 'i')
      ELSE i2.invoice_number
    END AS new_number
  FROM public.invoices i2
  LEFT JOIN LATERAL (
    SELECT event_date, bdc_number
    FROM public.events
    WHERE proposal_id = i2.proposal_id
    ORDER BY created_at DESC NULLS LAST
    LIMIT 1
  ) e ON true
) sub
WHERE i.id = sub.id
  AND i.invoice_number IS DISTINCT FROM sub.new_number;
