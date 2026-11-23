-- Candidate only: requires separate production approval.
-- Preserve the legacy role lookup and grants; replace only unnecessary dynamic SQL.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role text;
BEGIN
  SELECT p.role::text INTO user_role
  FROM public.user_profiles AS p
  WHERE p.user_id = auth.uid();
  RETURN COALESCE(user_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$function$;