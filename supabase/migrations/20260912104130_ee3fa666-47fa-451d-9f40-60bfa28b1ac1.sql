-- specialists
DROP POLICY IF EXISTS "Owner or admin staff can view specialists" ON public.specialists;
CREATE POLICY "Owner or admin staff can view specialists" ON public.specialists
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_or_staff_user()));

DROP POLICY IF EXISTS "Specialists update policy" ON public.specialists;
CREATE POLICY "Specialists update policy" ON public.specialists
FOR UPDATE
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()))
WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()));

DROP POLICY IF EXISTS "Specialists delete policy" ON public.specialists;
CREATE POLICY "Specialists delete policy" ON public.specialists
FOR DELETE USING ((SELECT public.is_admin_user()));

DROP POLICY IF EXISTS "Specialists write policy" ON public.specialists;
CREATE POLICY "Specialists write policy" ON public.specialists
FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()) OR user_id = (SELECT auth.uid()));

-- appointments
DROP POLICY IF EXISTS "Specialists and staff can view appointments" ON public.appointments;
CREATE POLICY "Specialists and staff can view appointments" ON public.appointments
FOR SELECT
USING (
  specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid()))
  OR (SELECT public.is_admin_user())
  OR (SELECT public.is_admin_or_staff_user())
);

DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
CREATE POLICY "Patients view own appointments" ON public.appointments
FOR SELECT TO authenticated
USING (
  patient_user_id = (SELECT auth.uid())
  OR patient_email = (SELECT p.email FROM public.patient_profiles p WHERE p.user_id = (SELECT auth.uid()) LIMIT 1)
);

DROP POLICY IF EXISTS "Specialists can update their appointments" ON public.appointments;
CREATE POLICY "Specialists can update their appointments" ON public.appointments
FOR UPDATE
USING (
  specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid()))
  OR (SELECT public.is_admin_user())
);

DROP POLICY IF EXISTS "Patients cancel own appointments" ON public.appointments;
CREATE POLICY "Patients cancel own appointments" ON public.appointments
FOR UPDATE TO authenticated
USING (patient_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Specialists can delete their appointments" ON public.appointments;
CREATE POLICY "Specialists can delete their appointments" ON public.appointments
FOR DELETE
USING (
  specialist_id IN (SELECT s.id FROM public.specialists s WHERE s.user_id = (SELECT auth.uid()))
  OR (SELECT public.is_admin_user())
);

-- reviews
DROP POLICY IF EXISTS "Admin staff can view all reviews" ON public.reviews;
CREATE POLICY "Admin staff can view all reviews" ON public.reviews
FOR SELECT TO authenticated
USING ((SELECT public.is_admin_or_staff_user()));

DROP POLICY IF EXISTS "Reviews manage policy" ON public.reviews;
CREATE POLICY "Reviews manage policy" ON public.reviews
FOR UPDATE
USING ((SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()))
WITH CHECK ((SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()));

DROP POLICY IF EXISTS "Reviews delete policy" ON public.reviews;
CREATE POLICY "Reviews delete policy" ON public.reviews
FOR DELETE
USING ((SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()));