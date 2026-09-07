CREATE OR REPLACE FUNCTION public.reject_blocked_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  digits text;
  last10 text;
  raw text;
BEGIN
  raw := COALESCE(NEW.patient_phone, '');
  IF raw = '' THEN
    RETURN NEW;
  END IF;
  digits := regexp_replace(raw, '\D', '', 'g');
  last10 := right(digits, 10);
  IF last10 IN ('5383254444', '5308443006', '5541582878') THEN
    RAISE EXCEPTION 'blocked_visitor: bu telefon numarasi ile islem yapilamaz';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_blocked_phone_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  digits text;
  last10 text;
BEGIN
  digits := regexp_replace(COALESCE(NEW.phone, ''), '\D', '', 'g');
  last10 := right(digits, 10);
  IF last10 IN ('5383254444', '5308443006', '5541582878') THEN
    RAISE EXCEPTION 'blocked_visitor: bu telefon numarasi ile islem yapilamaz';
  END IF;
  RETURN NEW;
END;
$$;