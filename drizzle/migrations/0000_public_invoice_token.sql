ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS token text;
UPDATE public.invoices SET token = encode(extensions.gen_random_bytes(24),'hex') WHERE token IS NULL;
ALTER TABLE public.invoices ALTER COLUMN token SET DEFAULT encode(extensions.gen_random_bytes(24),'hex');
CREATE UNIQUE INDEX IF NOT EXISTS invoices_token_key ON public.invoices(token);

CREATE OR REPLACE FUNCTION public.get_public_invoice(_key text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.invoices; prop jsonb; con jsonb; ev jsonb; cl jsonb;
BEGIN
  SELECT * INTO inv FROM public.invoices WHERE token = _key LIMIT 1;
  IF inv.id IS NULL AND _key ~* '^[0-9a-f-]{36}$' THEN
    SELECT * INTO inv FROM public.invoices WHERE id = _key::uuid LIMIT 1;
  END IF;
  IF inv.id IS NULL THEN RETURN NULL; END IF;

  SELECT to_jsonb(p) || jsonb_build_object('proposal_speakers', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('speaker_fee', ps.speaker_fee, 'travel_costs', ps.travel_costs,
      'agency_commission', ps.agency_commission, 'total_price', ps.total_price,
      'speakers', jsonb_build_object('id', s.id, 'name', s.name)))
    FROM public.proposal_speakers ps LEFT JOIN public.speakers s ON s.id = ps.speaker_id
    WHERE ps.proposal_id = p.id), '[]'::jsonb))
  INTO prop FROM public.proposals p WHERE p.id = inv.proposal_id;

  IF inv.contract_id IS NOT NULL THEN
    SELECT to_jsonb(c) INTO con FROM public.contracts c WHERE c.id = inv.contract_id;
  ELSE
    SELECT to_jsonb(c) INTO con FROM public.contracts c WHERE c.proposal_id = inv.proposal_id ORDER BY c.created_at DESC LIMIT 1;
  END IF;
  SELECT to_jsonb(e) INTO ev FROM public.events e WHERE e.proposal_id = inv.proposal_id ORDER BY e.created_at DESC LIMIT 1;
  IF prop ? 'client_id' AND (prop->>'client_id') IS NOT NULL THEN
    SELECT to_jsonb(c) INTO cl FROM public.clients c WHERE c.id = (prop->>'client_id')::uuid;
  END IF;

  RETURN jsonb_build_object('invoice', to_jsonb(inv), 'proposal', prop, 'contract', con, 'event', ev, 'client', cl);
END $$;
GRANT EXECUTE ON FUNCTION public.get_public_invoice(text) TO anon, authenticated;