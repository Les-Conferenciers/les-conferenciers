
-- ============================================================
-- #13 EDF 1041 : permettre une facture solde alors qu'un acompte existe déjà
-- Le numéro était identique (YYYYMMDD-BDC) → violation de la contrainte UNIQUE.
-- Suffixe : -A pour acompte, -S pour solde, rien pour total.
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number(_proposal_id uuid, _invoice_type text DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ev_date date;
  bdc text;
  bdc_clean text;
  base_num text;
  suffix text := '';
  candidate text;
  attempt integer := 1;
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
    WHERE c.proposal_id = _proposal_id AND c.event_date IS NOT NULL
    ORDER BY c.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF ev_date IS NOT NULL AND bdc IS NOT NULL AND length(bdc) > 0 THEN
    bdc_clean := regexp_replace(bdc, '^BDC[- ]*', '', 'i');
    base_num := to_char(ev_date, 'YYYYMMDD') || '-' || bdc_clean;
  ELSE
    base_num := to_char(now(), 'YYYYMMDD') || '-' ||
                lpad((COALESCE((SELECT MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS integer))
                                FROM public.invoices
                                WHERE invoice_number LIKE to_char(now(), 'YYYYMMDD') || '-%'), 0) + 1)::text, 2, '0');
  END IF;

  IF _invoice_type = 'acompte' THEN suffix := '-A';
  ELSIF _invoice_type = 'solde' THEN suffix := '-S';
  ELSE suffix := '';
  END IF;

  candidate := base_num || suffix;
  WHILE EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = candidate) LOOP
    attempt := attempt + 1;
    candidate := base_num || suffix || '-' || attempt::text;
  END LOOP;

  RETURN candidate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number(NEW.proposal_id, NEW.invoice_type);
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- #4 Backfill : BDC 1040 SAFRAN — conférencier Dorine Bourneton manquant
-- ============================================================
UPDATE public.events
  SET selected_speaker_id = 'c9306ed9-9f36-4edb-a95b-92c81276e912'
  WHERE proposal_id = '0913d761-ac6f-4778-bff3-53db1c8c45f1'
    AND selected_speaker_id IS NULL;

UPDATE public.contracts
  SET selected_speaker_id = 'c9306ed9-9f36-4edb-a95b-92c81276e912'
  WHERE proposal_id = '0913d761-ac6f-4778-bff3-53db1c8c45f1'
    AND selected_speaker_id IS NULL;

INSERT INTO public.proposal_speakers (proposal_id, speaker_id, speaker_fee, travel_costs, agency_commission, total_price, display_order)
SELECT '0913d761-ac6f-4778-bff3-53db1c8c45f1', 'c9306ed9-9f36-4edb-a95b-92c81276e912', 0, 0, 0, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.proposal_speakers
   WHERE proposal_id = '0913d761-ac6f-4778-bff3-53db1c8c45f1'
     AND speaker_id  = 'c9306ed9-9f36-4edb-a95b-92c81276e912'
);
