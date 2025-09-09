-- Create a secure RPC to fetch client_referrals for a given year with definer rights
CREATE OR REPLACE FUNCTION public.admin_get_client_referrals(p_year integer)
RETURNS SETOF public.client_referrals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admin or staff
  IF NOT (public.is_admin_user() OR public.is_admin_or_staff_user()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT * FROM public.client_referrals WHERE year = p_year;
END;
$$;