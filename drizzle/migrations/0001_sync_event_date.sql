CREATE OR REPLACE FUNCTION public.sync_contract_date_to_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.superseded_at IS NULL AND NEW.event_date IS NOT NULL AND NEW.event_date IS DISTINCT FROM OLD.event_date THEN
    UPDATE public.events SET event_date = NEW.event_date
    WHERE proposal_id = NEW.proposal_id AND event_date IS DISTINCT FROM NEW.event_date;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_event_date_to_contract()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.event_date IS NOT NULL AND NEW.event_date IS DISTINCT FROM OLD.event_date THEN
    UPDATE public.contracts SET event_date = NEW.event_date
    WHERE proposal_id = NEW.proposal_id AND superseded_at IS NULL AND event_date IS DISTINCT FROM NEW.event_date;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sync_contract_date AFTER UPDATE OF event_date ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.sync_contract_date_to_event();
CREATE TRIGGER trg_sync_event_date AFTER UPDATE OF event_date ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_date_to_contract();