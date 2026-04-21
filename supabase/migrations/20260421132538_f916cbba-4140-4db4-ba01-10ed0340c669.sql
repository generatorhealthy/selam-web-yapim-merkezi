
-- Aşırı izinli policy'yi kaldır
DROP POLICY IF EXISTS "Anyone can lookup referral code by code value" ON public.specialist_referral_codes;

-- get_referrer_by_code'a anon ve authenticated execute izni ver
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO anon, authenticated;
