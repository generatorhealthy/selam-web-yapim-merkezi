-- Reset 2025 referrals to mirror 2026 exactly
DO $$
BEGIN
  -- 1) Remove all 2025 rows
  DELETE FROM public.client_referrals WHERE year = 2025;

  -- 2) Copy from 2026 to 2025
  INSERT INTO public.client_referrals (
    specialist_id, year, month, referral_count, notes, is_referred, referred_at, referred_by
  )
  SELECT 
    specialist_id,
    2025 AS year,
    month,
    referral_count,
    notes,
    is_referred,
    referred_at,
    referred_by
  FROM public.client_referrals
  WHERE year = 2026;
END $$;