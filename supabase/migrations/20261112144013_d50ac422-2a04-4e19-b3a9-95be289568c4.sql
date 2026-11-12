-- A
DROP POLICY IF EXISTS "Patients view own test results" ON public.test_results;
CREATE POLICY "Patients view own test results" ON public.test_results
  FOR SELECT TO authenticated USING (patient_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
CREATE POLICY "Patients view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (patient_user_id = (SELECT auth.uid()));

-- B
CREATE OR REPLACE FUNCTION public.enforce_patient_cancel_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND OLD.patient_user_id = auth.uid()
     AND NOT EXISTS (SELECT 1 FROM public.specialists s WHERE s.id = OLD.specialist_id AND s.user_id = auth.uid())
     AND NOT public.is_admin_or_staff_user() THEN
    IF NEW.status IS DISTINCT FROM 'cancelled'
       OR (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at') THEN
      RAISE EXCEPTION 'Danışan yalnızca randevusunu iptal edebilir';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_patient_cancel_only() FROM anon, authenticated, public;
DROP TRIGGER IF EXISTS trg_patient_cancel_only ON public.appointments;
CREATE TRIGGER trg_patient_cancel_only BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_patient_cancel_only();

-- C: existing backup tables -> admin only
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_policies
           WHERE schemaname='public' AND tablename LIKE 'backup\_%' AND policyname='Admin only access'
  LOOP
    EXECUTE format('DROP POLICY "Admin only access" ON public.%I', r.tablename);
    EXECUTE format('CREATE POLICY "Admin only access" ON public.%I FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())', r.tablename);
  END LOOP;
END $$;

-- C: future backups created by create_full_database_backup -> admin only
DO $$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d FROM pg_proc p
   WHERE p.pronamespace='public'::regnamespace AND p.proname='create_full_database_backup' LIMIT 1;
  IF d IS NOT NULL THEN
    d := replace(d, 'public.is_admin_or_staff_user()', 'public.is_admin_user()');
    EXECUTE d;
  END IF;
END $$;