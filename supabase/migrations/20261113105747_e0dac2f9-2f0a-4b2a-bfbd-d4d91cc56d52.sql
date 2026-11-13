CREATE OR REPLACE FUNCTION public.guard_appointment_slot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE raw jsonb; slots jsonb; day_key text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  IF NEW.specialist_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.specialist_id IS NOT DISTINCT FROM OLD.specialist_id
     AND NEW.appointment_date IS NOT DISTINCT FROM OLD.appointment_date
     AND NEW.appointment_time IS NOT DISTINCT FROM OLD.appointment_time THEN RETURN NEW; END IF;
  SELECT available_time_slots::jsonb INTO raw FROM public.specialists WHERE id = NEW.specialist_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'appointment_specialist_unknown' USING ERRCODE='P0001'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(NEW.specialist_id::text || NEW.appointment_date::text || NEW.appointment_time::text));
  IF (TG_OP = 'INSERT' OR NEW.appointment_date IS DISTINCT FROM OLD.appointment_date
      OR NEW.appointment_time IS DISTINCT FROM OLD.appointment_time)
     AND (NEW.appointment_date + NEW.appointment_time) < (now() AT TIME ZONE 'Europe/Istanbul') THEN
    RAISE EXCEPTION 'appointment_slot_in_past' USING ERRCODE='P0001';
  END IF;
  day_key := to_char(NEW.appointment_date, 'YYYY-MM-DD');
  IF jsonb_typeof(raw) = 'object' AND raw ? 'default' THEN
    slots := CASE WHEN (raw->'dates') ? day_key THEN raw->'dates'->day_key ELSE raw->'default' END;
  ELSIF jsonb_typeof(raw) = 'array' AND jsonb_array_length(raw) > 0 THEN slots := raw;
  ELSE slots := '["09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30","00:00"]'::jsonb;
  END IF;
  IF jsonb_typeof(slots) IS DISTINCT FROM 'array' OR NOT (slots ? to_char(NEW.appointment_time,'HH24:MI'))
     OR extract(second from NEW.appointment_time) <> 0 THEN
    RAISE EXCEPTION 'appointment_slot_unavailable' USING ERRCODE='P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.appointments a WHERE a.specialist_id=NEW.specialist_id
      AND a.appointment_date=NEW.appointment_date AND a.appointment_time=NEW.appointment_time
      AND a.status='confirmed' AND a.id<>NEW.id) THEN
    RAISE EXCEPTION 'appointment_slot_taken' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_appointment_slot() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_appointment_slot_trg ON public.appointments;
CREATE TRIGGER guard_appointment_slot_trg BEFORE INSERT OR UPDATE OF status,specialist_id,appointment_date,appointment_time
ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_slot();
CREATE OR REPLACE FUNCTION public.guard_anonymous_appointment_burst()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE claims jsonb; phone text; email text; recent_count integer; hour_count integer;
BEGIN
  claims := coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb;
  IF coalesce(claims->>'role',nullif(current_setting('request.jwt.claim.role',true),''),'') <> 'anon' THEN RETURN NEW; END IF;
  NEW.created_at := now();
  IF EXISTS (SELECT 1 FROM public.appointments WHERE id=NEW.id) THEN RETURN NEW; END IF;
  phone := right(regexp_replace(NEW.patient_phone,'[^0-9]','','g'),10);
  email := lower(trim(NEW.patient_email));
  IF length(phone)<10 OR email='' THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('appointment-contact:'||phone||':'||email,0));
  SELECT count(*) FILTER (WHERE a.created_at >= now()-interval '10 minutes'),count(*) INTO recent_count,hour_count
    FROM public.appointments a WHERE a.created_at >= now()-interval '1 hour'
      AND right(regexp_replace(a.patient_phone,'[^0-9]','','g'),10)=phone AND lower(trim(a.patient_email))=email;
  IF recent_count>=6 OR hour_count>=20 THEN
    RAISE EXCEPTION 'appointment_retry_later' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_anonymous_appointment_burst() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_anonymous_appointment_burst_trg BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_anonymous_appointment_burst();