CREATE OR REPLACE FUNCTION public.block_appointments_from_blocked_visitors()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_visitors bv
    WHERE (bv.email IS NOT NULL AND lower(bv.email) = lower(coalesce(NEW.patient_email, '')))
       OR (bv.full_name IS NOT NULL
           AND btrim(bv.full_name) <> ''
           AND lower(regexp_replace(bv.full_name, '\s+', ' ', 'g')) = lower(regexp_replace(btrim(coalesce(NEW.patient_name, '')), '\s+', ' ', 'g')))
       OR (bv.phone IS NOT NULL
           AND public.normalize_phone_digits(bv.phone) <> ''
           AND public.normalize_phone_digits(bv.phone) = public.normalize_phone_digits(NEW.patient_phone))
  ) THEN
    RAISE EXCEPTION 'blocked_visitor: randevu olusturma izni yok';
  END IF;
  RETURN NEW;
END;
$function$;