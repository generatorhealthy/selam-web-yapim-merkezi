-- 1) Revoke SELECT on the sensitive column from anon and authenticated roles
REVOKE SELECT (referral_signup_code) ON public.specialists FROM anon, authenticated;

-- 2) Provide a SECURITY DEFINER RPC so a specialist can see who registered using their referral code
CREATE OR REPLACE FUNCTION public.get_my_referred_specialists()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  created_at timestamptz,
  is_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_specialist_id uuid;
  v_code text;
BEGIN
  -- Identify the calling specialist
  SELECT s.id INTO v_specialist_id
  FROM public.specialists s
  WHERE s.user_id = auth.uid()
  LIMIT 1;

  IF v_specialist_id IS NULL THEN
    RETURN;
  END IF;

  -- Get this specialist's referral code
  SELECT src.code INTO v_code
  FROM public.specialist_referral_codes src
  WHERE src.specialist_id = v_specialist_id
  LIMIT 1;

  IF v_code IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.id, s.name, s.email, s.created_at, s.is_active
  FROM public.specialists s
  WHERE s.referral_signup_code = v_code
  ORDER BY s.created_at DESC;
END;
$$;

-- Allow callers to execute the function
REVOKE ALL ON FUNCTION public.get_my_referred_specialists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referred_specialists() TO authenticated;