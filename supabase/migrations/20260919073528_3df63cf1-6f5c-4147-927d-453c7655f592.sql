CREATE OR REPLACE FUNCTION public.block_appointments_from_blocked_visitors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip text;
BEGIN
  v_ip := public.client_ip_from_headers();
  IF (NEW.ip_address IS NULL OR btrim(coalesce(NEW.ip_address, '')) = '') AND v_ip IS NOT NULL THEN
    NEW.ip_address := v_ip;
  END IF;

  -- Mevcut kayitlarin guncellenmesi (onay/iptal/tamamlandi) engellenmez.
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_visitors bv
    WHERE (bv.email IS NOT NULL AND lower(bv.email) = lower(coalesce(NEW.patient_email, '')))
       OR (bv.full_name IS NOT NULL
           AND btrim(bv.full_name) <> ''
           AND lower(regexp_replace(bv.full_name, '\s+', ' ', 'g'))
             = lower(regexp_replace(btrim(coalesce(NEW.patient_name, '')), '\s+', ' ', 'g')))
       OR (bv.phone IS NOT NULL
           AND public.normalize_phone_digits(bv.phone) <> ''
           AND public.normalize_phone_digits(bv.phone) = public.normalize_phone_digits(NEW.patient_phone))
       OR (bv.ip_address IS NOT NULL AND btrim(bv.ip_address) <> ''
           AND NEW.ip_address IS NOT NULL AND btrim(NEW.ip_address) <> ''
           AND bv.ip_address = NEW.ip_address)
  ) THEN
    RAISE EXCEPTION 'blocked_visitor: randevu olusturma izni yok';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_blocked_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  digits text;
  last10 text;
  raw text;
  v_ip text;
BEGIN
  v_ip := public.client_ip_from_headers();
  IF (NEW.ip_address IS NULL OR btrim(coalesce(NEW.ip_address, '')) = '') AND v_ip IS NOT NULL THEN
    NEW.ip_address := v_ip;
  END IF;

  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  raw := COALESCE(NEW.patient_phone, '');
  IF raw = '' THEN
    RETURN NEW;
  END IF;
  digits := regexp_replace(raw, '\D', '', 'g');
  last10 := right(digits, 10);

  IF last10 IN ('5383254444', '5308443006', '5541582878', '5399572171') THEN
    RAISE EXCEPTION 'blocked_visitor: bu telefon numarasi ile islem yapilamaz';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_blocked_phone_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  digits text;
  last10 text;
  v_ip text;
  v_blocked boolean := false;
BEGIN
  v_ip := public.client_ip_from_headers();
  IF (NEW.ip_address IS NULL OR btrim(coalesce(NEW.ip_address, '')) = '') AND v_ip IS NOT NULL THEN
    NEW.ip_address := v_ip;
  END IF;

  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  digits := regexp_replace(COALESCE(NEW.phone, ''), '\D', '', 'g');
  last10 := right(digits, 10);

  IF last10 IN ('5383254444', '5308443006', '5541582878', '5399572171') THEN
    v_blocked := true;
  END IF;

  IF NOT v_blocked THEN
    SELECT EXISTS (
      SELECT 1 FROM public.blocked_visitors bv
      WHERE (bv.full_name IS NOT NULL
             AND btrim(bv.full_name) <> ''
             AND lower(regexp_replace(bv.full_name, '\s+', ' ', 'g'))
               = lower(regexp_replace(btrim(coalesce(NEW.full_name, '')), '\s+', ' ', 'g')))
         OR (bv.phone IS NOT NULL
             AND public.normalize_phone_digits(bv.phone) <> ''
             AND public.normalize_phone_digits(bv.phone) = public.normalize_phone_digits(NEW.phone))
         OR (bv.ip_address IS NOT NULL AND btrim(bv.ip_address) <> ''
             AND NEW.ip_address IS NOT NULL AND btrim(NEW.ip_address) <> ''
             AND bv.ip_address = NEW.ip_address)
    ) INTO v_blocked;
  END IF;

  IF v_blocked THEN
    RAISE EXCEPTION 'blocked_visitor: bu bilgilerle basvuru yapilamaz';
  END IF;

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_collect_litigation_evidence(text, text, text);
DROP FUNCTION IF EXISTS public.admin_collect_litigation_evidence(uuid);
DROP FUNCTION IF EXISTS public.admin_collect_litigation_evidence(text);