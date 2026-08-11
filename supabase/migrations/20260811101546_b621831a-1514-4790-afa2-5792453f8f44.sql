ALTER TABLE public.registration_analytics
  ADD COLUMN IF NOT EXISTS specialist_user_id uuid,
  ADD COLUMN IF NOT EXISTS specialist_email text,
  ADD COLUMN IF NOT EXISTS ref_code text;

CREATE INDEX IF NOT EXISTS idx_registration_analytics_specialist_user_id ON public.registration_analytics (specialist_user_id);
CREATE INDEX IF NOT EXISTS idx_registration_analytics_specialist_email ON public.registration_analytics (lower(specialist_email));

ALTER TABLE public.partner_referrals
  ADD COLUMN IF NOT EXISTS ref_code_used text,
  ADD COLUMN IF NOT EXISTS landing_url text,
  ADD COLUMN IF NOT EXISTS signup_session_id text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'link';

UPDATE public.partner_referrals
SET source = 'manual_backfill_timestamp'
WHERE signup_at = '2026-08-11 10:05:16.264778+00'
  AND ref_code_used IS NULL;

CREATE OR REPLACE FUNCTION public.register_partner_referral(
  p_referral_code text,
  p_specialist_user_id uuid,
  p_specialist_email text,
  p_specialist_name text,
  p_specialist_phone text,
  p_session_id text DEFAULT NULL,
  p_landing_url text DEFAULT NULL
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

  SELECT id, commission_per_signup INTO v_partner_id, v_commission
  FROM public.partners
  WHERE is_active = true
    AND (public.normalize_ref_code(referral_code) = v_norm
      OR public.normalize_ref_code(name) = v_norm)
  LIMIT 1;

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
    specialist_phone, commission_amount, commission_status,
    ref_code_used, landing_url, signup_session_id, source
  )
  VALUES (
    v_partner_id, p_specialist_user_id, lower(p_specialist_email), p_specialist_name,
    p_specialist_phone, COALESCE(v_commission, 1000), 'pending',
    p_referral_code, p_landing_url, p_session_id, 'link'
  )
  ON CONFLICT (partner_id, specialist_email) DO UPDATE
    SET specialist_user_id = COALESCE(EXCLUDED.specialist_user_id, public.partner_referrals.specialist_user_id),
        specialist_name = COALESCE(EXCLUDED.specialist_name, public.partner_referrals.specialist_name),
        specialist_phone = COALESCE(EXCLUDED.specialist_phone, public.partner_referrals.specialist_phone),
        ref_code_used = COALESCE(EXCLUDED.ref_code_used, public.partner_referrals.ref_code_used),
        landing_url = COALESCE(EXCLUDED.landing_url, public.partner_referrals.landing_url),
        signup_session_id = COALESCE(EXCLUDED.signup_session_id, public.partner_referrals.signup_session_id),
        source = 'link',
        updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_signup_identity_to_analytics(
  p_session_id text,
  p_specialist_user_id uuid,
  p_specialist_email text,
  p_ref_code text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.registration_analytics
  SET specialist_user_id = COALESCE(p_specialist_user_id, specialist_user_id),
      specialist_email = COALESCE(lower(p_specialist_email), specialist_email),
      ref_code = COALESCE(p_ref_code, ref_code),
      last_activity_at = NOW()
  WHERE session_id = p_session_id;
$$;

GRANT EXECUTE ON FUNCTION public.register_partner_referral(text, uuid, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attach_signup_identity_to_analytics(text, uuid, text, text) TO anon, authenticated, service_role;