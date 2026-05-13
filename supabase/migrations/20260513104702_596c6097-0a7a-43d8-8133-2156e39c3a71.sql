CREATE OR REPLACE FUNCTION public.get_invoice_bdc(_invoice_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.bdc_number
  FROM public.invoices i
  LEFT JOIN public.events e ON e.proposal_id = i.proposal_id
  LEFT JOIN public.proposals p ON p.id = i.proposal_id
  WHERE i.id = _invoice_id
    AND (
      auth.role() = 'authenticated'
      OR p.expires_at > now()
    )
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1
$$;