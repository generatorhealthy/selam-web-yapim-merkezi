-- Create function to check if user is admin or staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_is_admin_or_staff BOOLEAN := false;
BEGIN
  -- Direct check without RLS interference
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
    AND is_approved = true
  ) INTO user_is_admin_or_staff;
  
  RETURN COALESCE(user_is_admin_or_staff, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

-- Update the user profiles read policy to include staff users
DROP POLICY IF EXISTS "User profiles read policy" ON public.user_profiles;

CREATE POLICY "User profiles read policy" 
ON public.user_profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  is_admin_user() OR 
  is_admin_or_staff_user() OR 
  ((email = 'ali@ali.com'::text) AND (role = 'admin'::user_role))
);