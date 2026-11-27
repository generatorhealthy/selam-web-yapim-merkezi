REVOKE EXECUTE ON FUNCTION public.staff_hours_ok() FROM public, anon;
DROP POLICY IF EXISTS staff_working_hours_only ON public.user_profiles;
CREATE POLICY staff_working_hours_only ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.staff_hours_ok()) OR user_id = (SELECT auth.uid()))
  WITH CHECK ((SELECT public.staff_hours_ok()) OR user_id = (SELECT auth.uid()));