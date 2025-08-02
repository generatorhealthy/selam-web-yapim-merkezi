-- Fix specialists update policy to allow staff users
DROP POLICY "Specialists update policy" ON public.specialists;

CREATE POLICY "Specialists update policy" 
ON public.specialists 
FOR UPDATE 
USING (
  (user_id = auth.uid()) OR 
  is_admin_user() OR 
  is_admin_or_staff_user()
)
WITH CHECK (
  (user_id = auth.uid()) OR 
  is_admin_user() OR 
  is_admin_or_staff_user()
);

-- Also update the read policy to ensure staff can see all specialists for management
DROP POLICY "Specialists read policy" ON public.specialists;

CREATE POLICY "Specialists read policy" 
ON public.specialists 
FOR SELECT 
USING (
  (is_active = true) OR 
  (user_id = auth.uid()) OR 
  is_admin_user() OR 
  is_admin_or_staff_user()
);