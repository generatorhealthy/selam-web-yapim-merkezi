CREATE OR REPLACE FUNCTION public.get_my_panel_access()
RETURNS TABLE(role public.user_role, is_approved boolean, name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.role, up.is_approved, up.name, up.email
  FROM public.user_profiles AS up
  WHERE up.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_panel_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_panel_access() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_panel_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_panel_access() TO service_role;