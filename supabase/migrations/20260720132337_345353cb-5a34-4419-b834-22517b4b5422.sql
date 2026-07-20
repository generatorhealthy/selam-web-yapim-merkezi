
CREATE OR REPLACE FUNCTION public.register_partner_referral(
  p_referral_code text,
  p_specialist_user_id uuid,
  p_specialist_email text,
  p_specialist_name text,
  p_specialist_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_commission numeric;
  v_id uuid;
BEGIN
  IF p_referral_code IS NULL OR length(trim(p_referral_code)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT id, commission_per_signup INTO v_partner_id, v_commission
  FROM public.partners
  WHERE upper(referral_code) = upper(trim(p_referral_code))
    AND is_active = true
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.partner_referrals (
    partner_id, specialist_user_id, specialist_email, specialist_name,
    specialist_phone, commission_amount, commission_status
  )
  VALUES (
    v_partner_id, p_specialist_user_id, lower(p_specialist_email), p_specialist_name,
    p_specialist_phone, COALESCE(v_commission, 1000), 'pending'
  )
  ON CONFLICT (partner_id, specialist_email) DO UPDATE
    SET specialist_user_id = COALESCE(EXCLUDED.specialist_user_id, public.partner_referrals.specialist_user_id),
        specialist_name = COALESCE(EXCLUDED.specialist_name, public.partner_referrals.specialist_name),
        specialist_phone = COALESCE(EXCLUDED.specialist_phone, public.partner_referrals.specialist_phone),
        updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_partner_referral(text, uuid, text, text, text) TO anon, authenticated;
