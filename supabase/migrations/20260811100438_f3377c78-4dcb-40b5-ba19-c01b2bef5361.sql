
CREATE OR REPLACE FUNCTION public.normalize_ref_code(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    translate(lower(coalesce(p_text, '')),
      'çğıİöşüâîûÇĞÖŞÜ',
      'cgiiosuaiucgosu'),
    '[^a-z0-9]', '', 'g')
$$;

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
  v_norm text;
BEGIN
  v_norm := public.normalize_ref_code(p_referral_code);

  IF v_norm IS NULL OR length(v_norm) < 3 THEN
    RETURN NULL;
  END IF;

  -- 1) Tam normalize eşleşme (kod veya isim)
  SELECT id, commission_per_signup INTO v_partner_id, v_commission
  FROM public.partners
  WHERE is_active = true
    AND (public.normalize_ref_code(referral_code) = v_norm
      OR public.normalize_ref_code(name) = v_norm)
  LIMIT 1;

  -- 2) Kırpılmış / uzatılmış kodlar için önek eşleşmesi
  IF v_partner_id IS NULL THEN
    SELECT id, commission_per_signup INTO v_partner_id, v_commission
    FROM public.partners
    WHERE is_active = true
      AND (
        public.normalize_ref_code(referral_code) LIKE v_norm || '%'
        OR v_norm LIKE public.normalize_ref_code(referral_code) || '%'
        OR public.normalize_ref_code(name) LIKE v_norm || '%'
        OR v_norm LIKE public.normalize_ref_code(name) || '%'
      )
    ORDER BY length(public.normalize_ref_code(referral_code)) DESC
    LIMIT 1;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.normalize_ref_code(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_partner_referral(text, uuid, text, text, text) TO anon, authenticated;
