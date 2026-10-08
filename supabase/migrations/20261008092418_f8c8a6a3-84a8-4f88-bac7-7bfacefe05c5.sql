CREATE OR REPLACE FUNCTION public.protect_specialist_activation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL OR public.is_admin_or_staff_user() THEN
    RETURN NEW;
  END IF;
  -- Uzman kendi üyeliğini ödeme yapmadan aktifleştiremez
  NEW.is_active := OLD.is_active;
  NEW.registration_source := OLD.registration_source;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_specialist_activation ON public.specialists;
CREATE TRIGGER trg_protect_specialist_activation
BEFORE UPDATE ON public.specialists
FOR EACH ROW EXECUTE FUNCTION public.protect_specialist_activation();

CREATE OR REPLACE FUNCTION public.activate_specialist_on_order_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IN ('approved', 'completed')
     AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status NOT IN ('approved', 'completed')) THEN
    UPDATE public.specialists
    SET is_active = true
    WHERE lower(email) = lower(NEW.customer_email)
      AND registration_source = 'self_registration'
      AND is_active = false;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trigger_activate_specialist_on_order_approval ON public.orders;
CREATE TRIGGER trigger_activate_specialist_on_order_approval
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.activate_specialist_on_order_approval();