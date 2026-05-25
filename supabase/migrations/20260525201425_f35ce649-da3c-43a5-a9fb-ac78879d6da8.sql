CREATE OR REPLACE FUNCTION public.generate_invoice_number(_proposal_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF ev_date IS NULL THEN
    SELECT c.event_date INTO ev_date
    FROM public.contracts c
    WHERE c.proposal_id = _proposal_id
      AND c.event_date IS NOT NULL
    ORDER BY c.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF ev_date IS NOT NULL AND bdc IS NOT NULL AND length(bdc) > 0 THEN
    bdc_clean := regexp_replace(bdc, '^BDC[- ]*', '', 'i');
    RETURN to_char(ev_date, 'YYYYMMDD') || '-' || bdc_clean;
  END IF;

  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS integer)), 0) + 1
    INTO next_num
  FROM public.invoices
  WHERE invoice_number LIKE to_char(now(), 'YYYYMMDD') || '-%';

  RETURN to_char(now(), 'YYYYMMDD') || '-' || lpad(next_num::text, 2, '0');
END;
$function$;