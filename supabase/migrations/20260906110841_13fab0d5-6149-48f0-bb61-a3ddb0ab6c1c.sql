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
  IF last10 IN ('5383254444', '5308443006') THEN
    RAISE EXCEPTION 'blocked_visitor: bu telefon numarasi ile islem yapilamaz';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_blocked_phone ON public.appointments;
CREATE TRIGGER trg_appointments_blocked_phone
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_phone();

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
  IF last10 IN ('5383254444', '5308443006') THEN
    RAISE EXCEPTION 'blocked_visitor: bu telefon numarasi ile islem yapilamaz';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_danisan_basvurulari_blocked_phone ON public.danisan_basvurulari;
CREATE TRIGGER trg_danisan_basvurulari_blocked_phone
BEFORE INSERT ON public.danisan_basvurulari
FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_phone_lead();