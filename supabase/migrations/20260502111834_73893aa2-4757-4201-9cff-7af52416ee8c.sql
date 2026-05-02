-- 1) Trigger fonksiyonunu güncelle: sadece aktif uzmanları müşteri listesine ekle
CREATE OR REPLACE FUNCTION public.add_specialist_to_customers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  -- Email boşsa ekleme yapma
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Sadece aktif uzmanları ekle
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  v_email := NEW.email;

  INSERT INTO public.automatic_orders (
    customer_name, customer_email, customer_phone, package_name, package_type,
    amount, payment_method, customer_type, registration_date, monthly_payment_day,
    total_months, paid_months, is_active, customer_address, customer_city,
    customer_tc_no, company_name, company_tax_no, company_tax_office
  )
  SELECT
    NEW.name, v_email, COALESCE(NEW.phone, '0 216 706 06 11'),
    NEW.specialty || ' Paketi', LOWER(REPLACE(NEW.specialty, ' ', '_')),
    3000, 'banka_havalesi', 'individual', NOW(), 1, 24,
    ARRAY[]::integer[], true, NULL, NEW.city, NULL, NULL, NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.automatic_orders ao WHERE ao.customer_email = v_email
  );

  RETURN NEW;
END;
$function$;

-- 2) UPDATE trigger fonksiyonu: uzman aktif edildiğinde müşteri listesine ekle
CREATE OR REPLACE FUNCTION public.add_specialist_to_customers_on_activate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Sadece is_active false→true geçişinde
  IF (OLD.is_active IS DISTINCT FROM TRUE) AND NEW.is_active = TRUE
     AND NEW.email IS NOT NULL AND NEW.email <> '' THEN

    INSERT INTO public.automatic_orders (
      customer_name, customer_email, customer_phone, package_name, package_type,
      amount, payment_method, customer_type, registration_date, monthly_payment_day,
      total_months, paid_months, is_active, customer_address, customer_city,
      customer_tc_no, company_name, company_tax_no, company_tax_office
    )
    SELECT
      NEW.name, NEW.email, COALESCE(NEW.phone, '0 216 706 06 11'),
      NEW.specialty || ' Paketi', LOWER(REPLACE(NEW.specialty, ' ', '_')),
      3000, 'banka_havalesi', 'individual', NOW(), 1, 24,
      ARRAY[]::integer[], true, NULL, NEW.city, NULL, NULL, NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM public.automatic_orders ao WHERE ao.customer_email = NEW.email
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_add_specialist_to_customers_on_activate ON public.specialists;
CREATE TRIGGER trigger_add_specialist_to_customers_on_activate
AFTER UPDATE OF is_active ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.add_specialist_to_customers_on_activate();

-- 3) Mevcut müşteri listesinden, hiçbir aktif uzmanla eşleşmeyip yalnızca pasif uzmana karşılık gelen kayıtları temizle
DELETE FROM public.automatic_orders ao
WHERE ao.customer_email IN (
  SELECT email FROM public.specialists
  WHERE is_active = false AND email IS NOT NULL AND email <> ''
)
AND NOT EXISTS (
  SELECT 1 FROM public.specialists s2
  WHERE s2.email = ao.customer_email AND s2.is_active = true
);