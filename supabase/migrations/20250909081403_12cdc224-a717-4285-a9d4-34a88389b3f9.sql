-- Ensure unique constraint for deterministic upserts
CREATE UNIQUE INDEX IF NOT EXISTS uniq_client_referrals_specialist_year_month 
ON public.client_referrals (specialist_id, year, month);

-- Atomic upsert for referral count with role check
CREATE OR REPLACE FUNCTION public.admin_upsert_client_referral(
  p_specialist_id uuid,
  p_year integer,
  p_month integer,
  p_referral_count integer,
  p_referred_by uuid DEFAULT NULL
)
RETURNS public.client_referrals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_row public.client_referrals;
BEGIN
  -- Only allow admin or staff
  IF NOT (public.is_admin_user() OR public.is_admin_or_staff_user()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.client_referrals (
    specialist_id, year, month, referral_count, is_referred, referred_at, referred_by, updated_at
  ) VALUES (
    p_specialist_id, p_year, p_month, p_referral_count,
    (p_referral_count > 0),
    CASE WHEN p_referral_count > 0 THEN now() ELSE NULL END,
    CASE WHEN p_referral_count > 0 THEN p_referred_by ELSE NULL END,
    now()
  )
  ON CONFLICT (specialist_id, year, month)
  DO UPDATE SET
    referral_count = EXCLUDED.referral_count,
    is_referred = EXCLUDED.is_referred,
    referred_at = EXCLUDED.referred_at,
    referred_by = EXCLUDED.referred_by,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Update or insert notes atomically
CREATE OR REPLACE FUNCTION public.admin_update_client_referral_notes(
  p_specialist_id uuid,
  p_year integer,
  p_month integer,
  p_notes text
)
RETURNS public.client_referrals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_row public.client_referrals;
BEGIN
  -- Only allow admin or staff
  IF NOT (public.is_admin_user() OR public.is_admin_or_staff_user()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.client_referrals (
    specialist_id, year, month, referral_count, notes, updated_at
  ) VALUES (
    p_specialist_id, p_year, p_month, 0, p_notes, now()
  )
  ON CONFLICT (specialist_id, year, month)
  DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;