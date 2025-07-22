-- Update get_current_user_role function to bypass RLS issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Use a direct query to bypass RLS on user_profiles table
  EXECUTE format('SELECT role::text FROM public.user_profiles WHERE user_id = %L', auth.uid()) INTO user_role;
  
  RETURN COALESCE(user_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$function$;