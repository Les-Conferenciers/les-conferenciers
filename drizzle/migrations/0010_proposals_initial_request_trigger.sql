CREATE OR REPLACE FUNCTION public.proposals_fill_initial_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND (NEW.initial_request IS NULL OR (TG_OP = 'UPDATE' AND NEW.lead_id IS DISTINCT FROM OLD.lead_id)) THEN
    SELECT to_jsonb(l) INTO NEW.initial_request FROM public.simulator_leads l WHERE l.id = NEW.lead_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_proposals_fill_initial_request BEFORE INSERT OR UPDATE OF lead_id ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.proposals_fill_initial_request();