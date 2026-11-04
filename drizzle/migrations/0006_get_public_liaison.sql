CREATE OR REPLACE FUNCTION public.get_public_liaison(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ev public.events; prop jsonb; con jsonb;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN RETURN NULL; END IF;
  SELECT * INTO ev FROM public.events WHERE token = _token LIMIT 1;
  IF ev.id IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object('client_name', p.client_name, 'recipient_name', p.recipient_name, 'client_phone', p.client_phone,
    'proposal_speakers', COALESCE((SELECT jsonb_agg(jsonb_build_object('speaker_id', ps.speaker_id,
      'speakers', jsonb_build_object('name', s.name, 'phone', s.phone)) ORDER BY ps.display_order NULLS LAST)
      FROM public.proposal_speakers ps LEFT JOIN public.speakers s ON s.id = ps.speaker_id WHERE ps.proposal_id = p.id), '[]'::jsonb))
  INTO prop FROM public.proposals p WHERE p.id = ev.proposal_id;
  SELECT jsonb_build_object('id', c.id, 'event_date', c.event_date, 'event_location', c.event_location,
    'event_time', c.event_time, 'event_description', c.event_description)
  INTO con FROM public.contracts c WHERE c.proposal_id = ev.proposal_id AND c.superseded_at IS NULL
  ORDER BY c.created_at DESC LIMIT 1;
  RETURN jsonb_build_object('event', to_jsonb(ev) || jsonb_build_object('proposal', prop), 'contract', con);
END $$;
GRANT EXECUTE ON FUNCTION public.get_public_liaison(text) TO anon, authenticated;