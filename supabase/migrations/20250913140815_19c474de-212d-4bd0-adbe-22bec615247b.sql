-- Copy 2026 client_referrals into 2025 without overwriting existing 2025 data
DO $$
BEGIN
  INSERT INTO public.client_referrals (
    specialist_id, year, month, referral_count, notes, is_referred, referred_at, referred_by
  )
  SELECT 
    cr26.specialist_id,
    2025 as year,
    cr26.month,
    cr26.referral_count,
    cr26.notes,
    cr26.is_referred,
    cr26.referred_at,
    cr26.referred_by
  FROM public.client_referrals cr26
  WHERE cr26.year = 2026
  ON CONFLICT (specialist_id, year, month) DO NOTHING;
END $$;