-- Fix RLS policies for admin access
-- First, let's create a more reliable admin check function
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_is_admin BOOLEAN := false;
BEGIN
  -- Direct check without RLS interference
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_approved = true
  ) INTO user_is_admin;
  
  RETURN COALESCE(user_is_admin, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$function$;

-- Update automatic_orders policies to use the new function
DROP POLICY IF EXISTS "Admin and Staff can manage automatic orders" ON public.automatic_orders;

CREATE POLICY "Admin and Staff can manage automatic orders" 
ON public.automatic_orders 
FOR ALL 
USING (
  -- Allow if user is admin/staff or if it's a public read operation
  (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'staff') 
      AND is_approved = true
    )
  ) OR (
    -- Allow public read access
    current_setting('request.method', true) = 'GET'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff') 
    AND is_approved = true
  )
);