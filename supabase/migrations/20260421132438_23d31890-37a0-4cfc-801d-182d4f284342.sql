
-- ============== 1. specialists tablosuna referral_signup_code alanı ==============
ALTER TABLE public.specialists
  ADD COLUMN IF NOT EXISTS referral_signup_code text;

CREATE INDEX IF NOT EXISTS idx_specialists_referral_signup_code
  ON public.specialists (referral_signup_code)
  WHERE referral_signup_code IS NOT NULL;

-- ============== 2. specialist_referral_codes tablosu ==============
CREATE TABLE IF NOT EXISTS public.specialist_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL UNIQUE REFERENCES public.specialists(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialist_referral_codes_code
  ON public.specialist_referral_codes (code);

ALTER TABLE public.specialist_referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS: uzman kendi kodunu okur
DROP POLICY IF EXISTS "Specialist can read own referral code" ON public.specialist_referral_codes;
CREATE POLICY "Specialist can read own referral code"
ON public.specialist_referral_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = specialist_referral_codes.specialist_id
      AND s.user_id = auth.uid()
  )
);

-- RLS: kayıt sırasında kod doğrulanabilmesi için anonymous select (sadece code bazlı arama)
DROP POLICY IF EXISTS "Anyone can lookup referral code by code value" ON public.specialist_referral_codes;
CREATE POLICY "Anyone can lookup referral code by code value"
ON public.specialist_referral_codes
FOR SELECT
TO anon, authenticated
USING (true);

-- RLS: admin/staff her şeyi yönetebilir
DROP POLICY IF EXISTS "Admin manage referral codes" ON public.specialist_referral_codes;
CREATE POLICY "Admin manage referral codes"
ON public.specialist_referral_codes
FOR ALL
TO authenticated
USING (public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_or_staff_user());

-- ============== 3. Kod üretim fonksiyonu ==============
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- karışıklığı önlemek için 0,1,O,I yok
  v_code text;
  v_exists boolean;
  v_attempt int := 0;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM public.specialist_referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;

    v_attempt := v_attempt + 1;
    IF v_attempt > 20 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 20 attempts';
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$;

-- ============== 4. Yeni uzman insert edildiğinde otomatik kod ==============
CREATE OR REPLACE FUNCTION public.create_referral_code_for_new_specialist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.specialist_referral_codes (specialist_id, code)
  VALUES (NEW.id, public.generate_unique_referral_code())
  ON CONFLICT (specialist_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_referral_code_after_specialist_insert ON public.specialists;
CREATE TRIGGER trg_create_referral_code_after_specialist_insert
  AFTER INSERT ON public.specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.create_referral_code_for_new_specialist();

-- ============== 5. Mevcut tüm uzmanlara kod ata ==============
INSERT INTO public.specialist_referral_codes (specialist_id, code)
SELECT s.id, public.generate_unique_referral_code()
FROM public.specialists s
WHERE NOT EXISTS (
  SELECT 1 FROM public.specialist_referral_codes c WHERE c.specialist_id = s.id
);

-- ============== 6. specialist_referrals tablosu ==============
CREATE TABLE IF NOT EXISTS public.specialist_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  referred_specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | qualified | bonus_granted | cancelled
  bonus_months integer NOT NULL DEFAULT 2,
  bonus_apply_after timestamptz,         -- davet edilenin 12 ay taahhüt bitişi
  qualified_at timestamptz,
  bonus_applied_at timestamptz,
  bonus_order_id uuid,                   -- orders tablosuna oluşturulan ücretsiz sipariş id
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_specialist_id)        -- bir uzman yalnızca bir kez referans olabilir
);

CREATE INDEX IF NOT EXISTS idx_specialist_referrals_referrer
  ON public.specialist_referrals (referrer_specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_referrals_status
  ON public.specialist_referrals (status);
CREATE INDEX IF NOT EXISTS idx_specialist_referrals_apply_after
  ON public.specialist_referrals (bonus_apply_after)
  WHERE status = 'qualified';

ALTER TABLE public.specialist_referrals ENABLE ROW LEVEL SECURITY;

-- Davet eden kendi kayıtlarını görür
DROP POLICY IF EXISTS "Referrer can read own referrals" ON public.specialist_referrals;
CREATE POLICY "Referrer can read own referrals"
ON public.specialist_referrals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = specialist_referrals.referrer_specialist_id
      AND s.user_id = auth.uid()
  )
);

-- Davet edilen kendi kaydını görür
DROP POLICY IF EXISTS "Referred can read own referral" ON public.specialist_referrals;
CREATE POLICY "Referred can read own referral"
ON public.specialist_referrals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = specialist_referrals.referred_specialist_id
      AND s.user_id = auth.uid()
  )
);

-- Admin/staff hepsini yönetir
DROP POLICY IF EXISTS "Admin manage referrals" ON public.specialist_referrals;
CREATE POLICY "Admin manage referrals"
ON public.specialist_referrals
FOR ALL
TO authenticated
USING (public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_or_staff_user());

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_specialist_referrals_set_updated_at ON public.specialist_referrals;
CREATE TRIGGER trg_specialist_referrals_set_updated_at
  BEFORE UPDATE ON public.specialist_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_timestamp_update();

-- ============== 7. Sipariş onaylanınca referans kaydı qualified yap ==============
CREATE OR REPLACE FUNCTION public.qualify_referral_on_first_paid_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_specialist RECORD;
  v_referrer_id uuid;
  v_apply_after timestamptz;
BEGIN
  -- Sadece status approved/completed olduğunda ve ilk ay (subscription_month=1 veya is_first_order=true) ise tetikle
  IF NEW.status NOT IN ('approved', 'completed') THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('approved', 'completed') THEN
    RETURN NEW;
  END IF;

  IF NOT (COALESCE(NEW.subscription_month, 1) = 1 OR COALESCE(NEW.is_first_order, false)) THEN
    RETURN NEW;
  END IF;

  -- Referans bonusu siparişlerini atla (sonsuz döngüyü önle)
  IF NEW.payment_method = 'referral_bonus' THEN
    RETURN NEW;
  END IF;

  -- Davet edilen uzmanı bul
  SELECT s.id, s.referral_signup_code, s.created_at, ao.registration_date
  INTO v_referred_specialist
  FROM public.specialists s
  LEFT JOIN public.automatic_orders ao ON ao.customer_email = s.email
  WHERE s.email = NEW.customer_email
  LIMIT 1;

  IF v_referred_specialist.id IS NULL OR v_referred_specialist.referral_signup_code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Davet eden uzmanı koddan bul
  SELECT specialist_id INTO v_referrer_id
  FROM public.specialist_referral_codes
  WHERE code = v_referred_specialist.referral_signup_code
  LIMIT 1;

  IF v_referrer_id IS NULL OR v_referrer_id = v_referred_specialist.id THEN
    RETURN NEW; -- kendine davet engelle
  END IF;

  -- Bonus uygulama tarihi: registration_date + 12 ay (yoksa created_at + 12 ay)
  v_apply_after := COALESCE(v_referred_specialist.registration_date, v_referred_specialist.created_at, now()) + interval '12 months';

  -- Referans kaydını oluştur veya qualified'a çek
  INSERT INTO public.specialist_referrals (
    referrer_specialist_id,
    referred_specialist_id,
    referral_code,
    status,
    bonus_months,
    bonus_apply_after,
    qualified_at
  ) VALUES (
    v_referrer_id,
    v_referred_specialist.id,
    v_referred_specialist.referral_signup_code,
    'qualified',
    2,
    v_apply_after,
    now()
  )
  ON CONFLICT (referred_specialist_id) DO UPDATE
    SET status = CASE
                   WHEN public.specialist_referrals.status IN ('bonus_granted','cancelled')
                     THEN public.specialist_referrals.status
                   ELSE 'qualified'
                 END,
        bonus_apply_after = COALESCE(public.specialist_referrals.bonus_apply_after, EXCLUDED.bonus_apply_after),
        qualified_at = COALESCE(public.specialist_referrals.qualified_at, now()),
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_qualify_referral_on_order ON public.orders;
CREATE TRIGGER trg_qualify_referral_on_order
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.qualify_referral_on_first_paid_order();

-- ============== 8. Public yardımcı: davet kodundan referrer adı al ==============
CREATE OR REPLACE FUNCTION public.get_referrer_by_code(p_code text)
RETURNS TABLE(referrer_id uuid, referrer_name text, code text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, c.code
  FROM public.specialist_referral_codes c
  JOIN public.specialists s ON s.id = c.specialist_id
  WHERE c.code = upper(p_code)
  LIMIT 1;
$$;

-- ============== 9. Uzmanın bonus özetini döndüren fonksiyon ==============
CREATE OR REPLACE FUNCTION public.get_my_referral_summary()
RETURNS TABLE(
  code text,
  total_referrals integer,
  qualified_referrals integer,
  granted_referrals integer,
  total_bonus_months integer,
  pending_bonus_months integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_specialist_id uuid;
BEGIN
  SELECT id INTO v_specialist_id
  FROM public.specialists
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_specialist_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    (SELECT c.code FROM public.specialist_referral_codes c WHERE c.specialist_id = v_specialist_id) AS code,
    COUNT(*)::int AS total_referrals,
    COUNT(*) FILTER (WHERE r.status IN ('qualified','bonus_granted'))::int AS qualified_referrals,
    COUNT(*) FILTER (WHERE r.status = 'bonus_granted')::int AS granted_referrals,
    COALESCE(SUM(r.bonus_months) FILTER (WHERE r.status IN ('qualified','bonus_granted')), 0)::int AS total_bonus_months,
    COALESCE(SUM(r.bonus_months) FILTER (WHERE r.status = 'qualified'), 0)::int AS pending_bonus_months
  FROM public.specialist_referrals r
  WHERE r.referrer_specialist_id = v_specialist_id;
END;
$$;
