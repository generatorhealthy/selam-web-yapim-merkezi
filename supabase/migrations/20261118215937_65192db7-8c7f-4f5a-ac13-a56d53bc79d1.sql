-- Additive: existing appointments are not rewritten or re-notified.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admin_review_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admin_released_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS admin_released_by uuid;

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
  IF NEW.admin_review_required IS DISTINCT FROM OLD.admin_review_required
     OR NEW.admin_released_at IS DISTINCT FROM OLD.admin_released_at
     OR NEW.admin_released_by IS DISTINCT FROM OLD.admin_released_by THEN
    RAISE EXCEPTION 'appointment_review_fields_immutable' USING ERRCODE='42501';
  END IF;
  IF OLD.admin_review_required AND OLD.admin_released_at IS NULL THEN
    IF NEW.specialist_id IS DISTINCT FROM OLD.specialist_id AND NOT public.is_admin_user() THEN
      RAISE EXCEPTION 'appointment_review_admin_required' USING ERRCODE='42501';
    END IF;
    IF NEW.status IN ('confirmed','completed') THEN
      IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'appointment_review_admin_required' USING ERRCODE='42501';
      END IF;
      IF OLD.status <> 'pending' OR NEW.status <> 'confirmed' THEN
        RAISE EXCEPTION 'appointment_review_pending_required' USING ERRCODE='42501';
      END IF;
      NEW.admin_released_at := clock_timestamp();
      NEW.admin_released_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_appointment_admin_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_appointment_admin_review() TO service_role;
CREATE TRIGGER a01_appointment_admin_review BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_admin_review();

CREATE POLICY appointment_review_read ON public.appointments AS RESTRICTIVE FOR SELECT TO authenticated
USING (NOT admin_review_required OR admin_released_at IS NOT NULL OR public.is_admin_or_staff_user() OR patient_user_id=auth.uid());
CREATE POLICY appointment_review_update ON public.appointments AS RESTRICTIVE FOR UPDATE TO authenticated
USING (NOT admin_review_required OR admin_released_at IS NOT NULL OR public.is_admin_user() OR patient_user_id=auth.uid())
WITH CHECK (NOT admin_review_required OR admin_released_at IS NOT NULL OR public.is_admin_user() OR patient_user_id=auth.uid());
CREATE POLICY appointment_review_delete ON public.appointments AS RESTRICTIVE FOR DELETE TO authenticated
USING (NOT admin_review_required OR admin_released_at IS NOT NULL OR public.is_admin_user());

-- Patch exact current trigger functions in-place, preserving trusted transport.
-- No scheduler/secret is created, exported or changed by this release.
DO $patch$
DECLARE definition text; fn text; gate text;
BEGIN
  gate := E'\n  IF NEW.admin_review_required AND (NEW.admin_released_at IS NULL OR NEW.status <> ''confirmed'') THEN RETURN NEW; END IF;\n  IF TG_OP = ''UPDATE'' THEN\n    IF NOT NEW.admin_review_required OR OLD.admin_released_at IS NOT NULL OR NEW.admin_released_at IS NULL THEN RETURN NEW; END IF;\n  END IF;\n';
  FOREACH fn IN ARRAY ARRAY['send_appointment_notification_email','notify_specialist_new_appointment'] LOOP
    definition := pg_get_functiondef(('public.'||fn||'()')::regprocedure);
    IF position('admin_review_required' IN definition)>0 OR position(E'BEGIN\n' IN definition)=0 THEN
      RAISE EXCEPTION 'unexpected appointment notification definition: %',fn;
    END IF;
    definition := replace(definition,E'BEGIN\n',E'BEGIN\n'||gate);
    IF fn='send_appointment_notification_email' THEN
      IF position('IF TG_OP = ''INSERT'' THEN' IN definition)=0 THEN RAISE EXCEPTION 'unexpected email condition'; END IF;
      definition := replace(definition,'IF TG_OP = ''INSERT'' THEN','IF TG_OP IN (''INSERT'',''UPDATE'') THEN');
      -- Minimize email/WA/SMS trigger body to the bound capability and ID only.
      definition := regexp_replace(definition,
        '''appointmentId'', NEW.id, ''notificationToken'', notification_token,[\s\S]*?''notes'', NEW.notes',
        '''appointmentId'', NEW.id, ''notificationToken'', notification_token');
      IF position('''notes'', NEW.notes' IN definition)>0 THEN RAISE EXCEPTION 'notification payload minimization failed'; END IF;
    END IF;
    EXECUTE definition;
  END LOOP;
END $patch$;
DROP TRIGGER send_appointment_notification_email_trigger ON public.appointments;
CREATE TRIGGER send_appointment_notification_email_trigger AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.send_appointment_notification_email();
DROP TRIGGER trg_notify_new_appointment ON public.appointments;
CREATE TRIGGER trg_notify_new_appointment AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_appointment();

-- Table publication is safe only after the restrictive visibility policies above.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='appointments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;