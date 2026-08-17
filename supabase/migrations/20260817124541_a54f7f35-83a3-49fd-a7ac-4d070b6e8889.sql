CREATE TABLE IF NOT EXISTS public.blocked_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  ip_address text,
  full_name text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_visitors TO authenticated;
GRANT ALL ON public.blocked_visitors TO service_role;

ALTER TABLE public.blocked_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can manage blocked visitors"
ON public.blocked_visitors FOR ALL TO authenticated
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT right(regexp_replace(coalesce(_phone, ''), '\D', '', 'g'), 10)
$$;

CREATE OR REPLACE FUNCTION public.block_appointments_from_blocked_visitors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_visitors bv
    WHERE (bv.email IS NOT NULL AND lower(bv.email) = lower(coalesce(NEW.patient_email, '')))
       OR (bv.phone IS NOT NULL
           AND public.normalize_phone_digits(bv.phone) <> ''
           AND public.normalize_phone_digits(bv.phone) = public.normalize_phone_digits(NEW.patient_phone))
  ) THEN
    RAISE EXCEPTION 'blocked_visitor: randevu olusturma izni yok';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_blocked_visitors ON public.appointments;
CREATE TRIGGER trg_block_blocked_visitors
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.block_appointments_from_blocked_visitors();