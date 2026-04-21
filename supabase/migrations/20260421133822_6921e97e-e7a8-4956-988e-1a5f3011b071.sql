-- Yeni specialist eklendiğinde, referral_signup_code set edilmişse referrer'ı bulup specialist_referrals kaydı oluştur
CREATE OR REPLACE FUNCTION public.create_referral_record_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id uuid;
  v_code text;
BEGIN
  IF NEW.referral_signup_code IS NULL OR length(trim(NEW.referral_signup_code)) = 0 THEN
    RETURN NEW;
  END IF;

  v_code := upper(trim(NEW.referral_signup_code));

  SELECT specialist_id INTO v_referrer_id
  FROM public.specialist_referral_codes
  WHERE code = v_code
  LIMIT 1;

  IF v_referrer_id IS NULL OR v_referrer_id = NEW.id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.specialist_referrals (
    referrer_specialist_id,
    referred_specialist_id,
    referral_code,
    status
  ) VALUES (
    v_referrer_id,
    NEW.id,
    v_code,
    'pending'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_referral_record_on_signup ON public.specialists;
CREATE TRIGGER trg_create_referral_record_on_signup
AFTER INSERT ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.create_referral_record_on_signup();