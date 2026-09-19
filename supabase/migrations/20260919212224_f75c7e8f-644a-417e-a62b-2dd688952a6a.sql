DROP POLICY IF EXISTS "Authenticated can view freepbx extensions" ON public.freepbx_extensions;
CREATE POLICY "Admin and staff can view freepbx extensions"
ON public.freepbx_extensions FOR SELECT TO authenticated
USING (public.is_admin_or_staff_user());