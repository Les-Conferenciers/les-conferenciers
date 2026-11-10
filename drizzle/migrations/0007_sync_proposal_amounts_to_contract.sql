CREATE OR REPLACE FUNCTION public.sync_proposal_speaker_to_contract(_ps_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ps public.proposal_speakers; sp_name text; c record; lines jsonb; new_lines jsonb := '[]'::jsonb; l jsonb;
  n_speaker int; matched boolean := false; has_travel boolean := false; sel uuid;
BEGIN
  SELECT * INTO ps FROM public.proposal_speakers WHERE id = _ps_id;
  IF ps.id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = ps.proposal_id AND (p.status = 'accepted' OR p.accepted_at IS NOT NULL)) THEN RETURN; END IF;
  SELECT name INTO sp_name FROM public.speakers WHERE id = ps.speaker_id;
  FOR c IN SELECT * FROM public.contracts WHERE proposal_id = ps.proposal_id AND signed_at IS NULL AND superseded_at IS NULL LOOP
    sel := COALESCE(c.selected_speaker_id, (SELECT e.selected_speaker_id FROM public.events e WHERE e.proposal_id = ps.proposal_id ORDER BY e.created_at DESC LIMIT 1));
    IF sel IS NOT NULL AND sel <> ps.speaker_id THEN CONTINUE; END IF;
    IF sel IS NULL AND (SELECT count(*) FROM public.proposal_speakers WHERE proposal_id = ps.proposal_id) > 1 THEN CONTINUE; END IF;
    lines := COALESCE(c.contract_lines, '[]'::jsonb);
    SELECT count(*) INTO n_speaker FROM jsonb_array_elements(lines) x WHERE x->>'type' = 'speaker';
    FOR l IN SELECT * FROM jsonb_array_elements(lines) LOOP
      IF l->>'type' = 'speaker' AND NOT matched AND (n_speaker = 1 OR l->>'label' = sp_name) THEN
        l := jsonb_set(l, '{amount_ht}', to_jsonb(COALESCE(ps.speaker_fee, 0))); matched := true;
      ELSIF l->>'type' = 'travel' AND NOT has_travel THEN
        l := jsonb_set(l, '{amount_ht}', to_jsonb(COALESCE(ps.travel_costs, 0))); has_travel := true;
      END IF;
      new_lines := new_lines || jsonb_build_array(l);
    END LOOP;
    IF NOT matched THEN
      new_lines := jsonb_build_array(jsonb_build_object('id', substr(md5(random()::text),1,8), 'label', COALESCE(sp_name,'Conférencier'), 'amount_ht', COALESCE(ps.speaker_fee,0), 'tva_rate', 20, 'type', 'speaker')) || new_lines;
    END IF;
    IF NOT has_travel AND COALESCE(ps.travel_costs,0) > 0 THEN
      new_lines := new_lines || jsonb_build_array(jsonb_build_object('id', substr(md5(random()::text),1,8), 'label', 'Frais de déplacement', 'amount_ht', ps.travel_costs, 'tva_rate', 20, 'type', 'travel'));
    END IF;
    UPDATE public.contracts SET contract_lines = new_lines, agency_commission = COALESCE(ps.agency_commission, 0) WHERE id = c.id;
    new_lines := '[]'::jsonb; matched := false; has_travel := false;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.trg_proposal_speaker_amounts() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.speaker_fee IS DISTINCT FROM OLD.speaker_fee OR NEW.agency_commission IS DISTINCT FROM OLD.agency_commission OR NEW.travel_costs IS DISTINCT FROM OLD.travel_costs THEN
    PERFORM public.sync_proposal_speaker_to_contract(NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_proposal_speaker_amounts AFTER UPDATE ON public.proposal_speakers FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_speaker_amounts();

CREATE OR REPLACE FUNCTION public.trg_proposal_accepted_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record;
BEGIN
  IF (NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted') OR (NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL) THEN
    FOR r IN SELECT id FROM public.proposal_speakers WHERE proposal_id = NEW.id LOOP
      PERFORM public.sync_proposal_speaker_to_contract(r.id);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_on_proposal_accepted AFTER UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_accepted_sync();
REVOKE EXECUTE ON FUNCTION public.sync_proposal_speaker_to_contract(uuid) FROM anon;