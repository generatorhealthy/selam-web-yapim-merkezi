-- Independent administrative release; no historical row updates or policy changes.
CREATE OR REPLACE FUNCTION public.guard_appointment_admin_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    NEW.admin_review_required := NOT coalesce(NEW.created_by_specialist,false);
    NEW.admin_released_at := NULL;
    NEW.admin_released_by := NULL;
    IF NEW.admin_review_required THEN NEW.status := 'pending'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.admin_review_required IS DISTINCT FROM OLD.admin_review_required THEN
    RAISE EXCEPTION 'appointment_review_fields_immutable' USING ERRCODE='42501';
  END IF;
  IF NEW.admin_released_at IS DISTINCT FROM OLD.admin_released_at
     OR NEW.admin_released_by IS DISTINCT FROM OLD.admin_released_by THEN
    IF NOT public.is_admin_user() OR NOT OLD.admin_review_required
       OR OLD.admin_released_at IS NOT NULL OR OLD.status <> 'pending'
       OR NEW.status <> 'pending' OR NEW.admin_released_at IS NULL
       OR NEW.specialist_id IS DISTINCT FROM OLD.specialist_id THEN
      RAISE EXCEPTION 'appointment_review_fields_immutable' USING ERRCODE='42501';
    END IF;
    NEW.admin_released_at := clock_timestamp();
    NEW.admin_released_by := auth.uid();
  END IF;
  IF OLD.admin_review_required AND OLD.admin_released_at IS NULL THEN
    IF NEW.specialist_id IS DISTINCT FROM OLD.specialist_id AND NOT public.is_admin_user() THEN
      RAISE EXCEPTION 'appointment_review_admin_required' USING ERRCODE='42501';
    END IF;
    IF NEW.status IN ('confirmed','completed') THEN
      RAISE EXCEPTION 'appointment_release_before_specialist_confirmation' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_appointment_admin_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_appointment_admin_review() TO service_role;

CREATE OR REPLACE FUNCTION public.release_appointment_to_specialist(p_appointment_id uuid)
RETURNS public.appointments LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE result public.appointments;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'appointment_review_admin_required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO result FROM public.appointments WHERE id=p_appointment_id FOR UPDATE;
  IF NOT FOUND OR NOT result.admin_review_required OR result.status <> 'pending'
     OR result.admin_released_at IS NOT NULL OR result.specialist_id IS NULL THEN
    RAISE EXCEPTION 'appointment_review_pending_required' USING ERRCODE='42501';
  END IF;
  UPDATE public.appointments SET admin_released_at=clock_timestamp(),admin_released_by=auth.uid()
  WHERE id=p_appointment_id RETURNING * INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.release_appointment_to_specialist(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.release_appointment_to_specialist(uuid) TO authenticated;

DO $patch$
DECLARE definition text; fn text; old_gate text; new_gate text;
BEGIN
  old_gate := 'IF NEW.admin_review_required AND (NEW.admin_released_at IS NULL OR NEW.status <> ''confirmed'') THEN RETURN NEW; END IF;';
  new_gate := 'IF NEW.admin_review_required AND (NEW.admin_released_at IS NULL OR NEW.status NOT IN (''pending'',''confirmed'')) THEN RETURN NEW; END IF;';
  FOREACH fn IN ARRAY ARRAY['send_appointment_notification_email','notify_specialist_new_appointment'] LOOP
    definition := pg_get_functiondef(('public.'||fn||'()')::regprocedure);
    IF position(old_gate IN definition)=0 THEN
      RAISE EXCEPTION 'unexpected appointment notification definition: %',fn;
    END IF;
    EXECUTE replace(definition,old_gate,new_gate);
  END LOOP;
END $patch$;