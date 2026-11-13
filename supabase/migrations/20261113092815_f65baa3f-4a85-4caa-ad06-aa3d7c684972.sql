CREATE UNIQUE INDEX IF NOT EXISTS appointments_one_confirmed_per_slot
  ON public.appointments (specialist_id, appointment_date, appointment_time)
  WHERE status = 'confirmed';

CREATE OR REPLACE FUNCTION public.guard_appointment_slot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' OR NEW.specialist_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.appointment_date IS NOT DISTINCT FROM OLD.appointment_date
     AND NEW.appointment_time IS NOT DISTINCT FROM OLD.appointment_time THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.specialist_id::text || NEW.appointment_date::text || NEW.appointment_time::text));
  IF TG_OP = 'INSERT' AND (NEW.appointment_date + NEW.appointment_time) < (now() AT TIME ZONE 'Europe/Istanbul') THEN
    RAISE EXCEPTION 'appointment_slot_in_past' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.appointments a WHERE a.specialist_id = NEW.specialist_id
      AND a.appointment_date = NEW.appointment_date AND a.appointment_time = NEW.appointment_time
      AND a.status = 'confirmed' AND a.id <> NEW.id) THEN
    RAISE EXCEPTION 'appointment_slot_taken' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_appointment_slot_trg ON public.appointments;
CREATE TRIGGER guard_appointment_slot_trg BEFORE INSERT OR UPDATE OF status, appointment_date, appointment_time
  ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_slot();