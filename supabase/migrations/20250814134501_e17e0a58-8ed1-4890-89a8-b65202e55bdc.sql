-- Check current client_referrals data and ensure specialists appear on their registration dates

-- First, let's ensure all specialists have referral records for their registration month/year
INSERT INTO public.client_referrals (specialist_id, year, month, referral_count)
SELECT 
  s.id as specialist_id,
  EXTRACT(YEAR FROM s.created_at) as year,
  EXTRACT(MONTH FROM s.created_at) as month,
  0 as referral_count
FROM public.specialists s
WHERE s.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.client_referrals cr 
  WHERE cr.specialist_id = s.id 
  AND cr.year = EXTRACT(YEAR FROM s.created_at)
  AND cr.month = EXTRACT(MONTH FROM s.created_at)
)
ON CONFLICT (specialist_id, year, month) DO NOTHING;

-- Also ensure specialists have current month/year records if they don't exist
INSERT INTO public.client_referrals (specialist_id, year, month, referral_count)
SELECT 
  s.id as specialist_id,
  EXTRACT(YEAR FROM NOW()) as year,
  EXTRACT(MONTH FROM NOW()) as month,
  0 as referral_count
FROM public.specialists s
WHERE s.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.client_referrals cr 
  WHERE cr.specialist_id = s.id 
  AND cr.year = EXTRACT(YEAR FROM NOW())
  AND cr.month = EXTRACT(MONTH FROM NOW())
)
ON CONFLICT (specialist_id, year, month) DO NOTHING;