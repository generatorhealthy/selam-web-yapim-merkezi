-- Allow self-registration: authenticated users can insert specialist with their own user_id
DROP POLICY IF EXISTS "Specialists write policy" ON public.specialists;

CREATE POLICY "Specialists write policy"
ON public.specialists
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user() OR is_admin_or_staff_user() OR (user_id = auth.uid())
);