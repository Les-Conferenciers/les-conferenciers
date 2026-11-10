CREATE OR REPLACE FUNCTION public.trg_proposal_speaker_amounts() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.speaker_fee IS DISTINCT FROM OLD.speaker_fee OR NEW.agency_commission IS DISTINCT FROM OLD.agency_commission OR NEW.travel_costs IS DISTINCT FROM OLD.travel_costs THEN
    PERFORM public.sync_proposal_speaker_to_contract(NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_proposal_speaker_amounts_ins AFTER INSERT ON public.proposal_speakers FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_speaker_amounts();