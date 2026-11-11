ALTER TABLE public.specialists ADD COLUMN IF NOT EXISTS billing_while_passive boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.remove_specialist_from_customers_on_deactivate()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.is_active = true AND (NEW.is_active IS DISTINCT FROM true) AND NOT COALESCE(NEW.billing_while_passive, false) THEN
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
      DELETE FROM public.automatic_orders WHERE customer_email = NEW.email;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;