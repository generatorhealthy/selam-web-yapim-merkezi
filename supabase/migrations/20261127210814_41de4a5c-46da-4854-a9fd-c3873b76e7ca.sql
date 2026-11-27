CREATE OR REPLACE FUNCTION public.staff_access_window_open(p_ts timestamptz)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT extract(isodow FROM (p_ts AT TIME ZONE 'Europe/Istanbul')) BETWEEN 1 AND 6
     AND (p_ts AT TIME ZONE 'Europe/Istanbul')::time >= time '09:30'
     AND (p_ts AT TIME ZONE 'Europe/Istanbul')::time <  time '18:30';
$$;

CREATE OR REPLACE FUNCTION public.staff_hours_ok()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NULL
      OR NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'staff')
      OR public.staff_access_window_open(now());
$$;

CREATE OR REPLACE FUNCTION public.staff_access_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'is_staff', EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'staff'),
    'open', public.staff_access_window_open(now()),
    'server_time', now());
$$;

REVOKE EXECUTE ON FUNCTION public.staff_access_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.staff_access_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_hours_ok() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_access_window_open(timestamptz) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid()
    AND is_approved = true
    AND (role = 'admin' OR (role = 'staff' AND public.staff_access_window_open(now()))));
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid()
    AND is_approved = true
    AND (role = 'admin' OR (role = 'staff' AND public.staff_access_window_open(now()))));
$$;

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity LOOP
    EXECUTE format('DROP POLICY IF EXISTS staff_working_hours_only ON public.%I', t.relname);
    IF t.relname = 'user_profiles' THEN
      EXECUTE 'CREATE POLICY staff_working_hours_only ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.staff_hours_ok()) OR user_id = auth.uid()) WITH CHECK ((SELECT public.staff_hours_ok()) OR user_id = auth.uid())';
    ELSE
      EXECUTE format('CREATE POLICY staff_working_hours_only ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.staff_hours_ok())) WITH CHECK ((SELECT public.staff_hours_ok()))', t.relname);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS staff_working_hours_only ON storage.objects;
CREATE POLICY staff_working_hours_only ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.staff_hours_ok())) WITH CHECK ((SELECT public.staff_hours_ok()));