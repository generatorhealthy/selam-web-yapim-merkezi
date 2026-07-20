
CREATE OR REPLACE FUNCTION public.link_partner_user(p_partner_id uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.is_admin_or_staff() THEN
    RAISE EXCEPTION 'Yetkisiz';
  END IF;

  SELECT up.user_id INTO v_user_id
  FROM public.user_profiles up
  WHERE lower(up.email) = lower(trim(p_email))
    AND up.role = 'partner'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bu e-posta ile partner rolünde kullanıcı bulunamadı';
  END IF;

  UPDATE public.partners
  SET user_id = v_user_id, updated_at = NOW()
  WHERE id = p_partner_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_partner_user(uuid, text) TO authenticated;
