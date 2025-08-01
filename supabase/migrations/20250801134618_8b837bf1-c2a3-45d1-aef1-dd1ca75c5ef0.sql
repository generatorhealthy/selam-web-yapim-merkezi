-- Update the specialists table RLS policies to allow staff users to insert specialists
DROP POLICY IF EXISTS "Specialists write policy" ON public.specialists;

CREATE POLICY "Specialists write policy" 
ON public.specialists 
FOR INSERT 
WITH CHECK (is_admin_user() OR is_admin_or_staff_user());