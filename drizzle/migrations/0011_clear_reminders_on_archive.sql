CREATE OR REPLACE FUNCTION public.trg_proposal_archived_clear_reminders()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('archived','lost') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.next_reminder_date := NULL; NEW.next_reminder_note := NULL;
    NEW.followup_reminder_date := NULL; NEW.followup_reminder_note := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.trg_proposal_archived_cancel_tasks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('archived','lost') AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.proposal_tasks SET status = 'cancelled', completed_at = now()
    WHERE proposal_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_proposal_archived_clear_reminders BEFORE UPDATE OF status ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_archived_clear_reminders();
CREATE TRIGGER trg_proposal_archived_cancel_tasks AFTER UPDATE OF status ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.trg_proposal_archived_cancel_tasks();