
-- 1) Mevcut eşleşmeyen (silinmiş/pasif uzmana ait) müşteri kayıtlarını temizle
DELETE FROM public.automatic_orders ao
WHERE NOT EXISTS (
  SELECT 1 FROM public.specialists s
  WHERE s.is_active = true AND s.email = ao.customer_email
);

-- 2) Eksik aktif uzmanları müşteri listesine ekle (gerçek package_price ile)
INSERT INTO public.automatic_orders (
  customer_name, customer_email, customer_phone, package_name, package_type,
  amount, payment_method, customer_type, registration_date, monthly_payment_day,
  total_months, paid_months, is_active, customer_city
)
SELECT
  s.name,
  s.email,
  COALESCE(s.phone, '0 216 706 06 11'),
  COALESCE(s.specialty, 'Uzman') || ' Paketi',
  LOWER(REPLACE(COALESCE(s.specialty, 'uzman'), ' ', '_')),
  COALESCE(s.package_price, 3000),
  'banka_havalesi', 'individual', NOW(),
  COALESCE(s.payment_day, 1), 24,
  ARRAY[]::integer[], true, s.city
FROM public.specialists s
WHERE s.is_active = true
  AND s.email IS NOT NULL AND s.email <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.automatic_orders ao WHERE ao.customer_email = s.email
  );

-- 3) Insert trigger fonksiyonunu, gerçek package_price kullanacak şekilde güncelle
CREATE OR REPLACE FUNCTION public.add_specialist_to_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  v_email := NEW.email;

  INSERT INTO public.automatic_orders (
    customer_name, customer_email, customer_phone, package_name, package_type,
    amount, payment_method, customer_type, registration_date, monthly_payment_day,
    total_months, paid_months, is_active, customer_city
  )
  SELECT
    NEW.name, v_email, COALESCE(NEW.phone, '0 216 706 06 11'),
    COALESCE(NEW.specialty, 'Uzman') || ' Paketi',
    LOWER(REPLACE(COALESCE(NEW.specialty, 'uzman'), ' ', '_')),
    COALESCE(NEW.package_price, 3000),
    'banka_havalesi', 'individual', NOW(),
    COALESCE(NEW.payment_day, 1), 24,
    ARRAY[]::integer[], true, NEW.city
  WHERE NOT EXISTS (
    SELECT 1 FROM public.automatic_orders ao WHERE ao.customer_email = v_email
  );

  RETURN NEW;
END;
$function$;

-- 4) Aktif olunca ekleme trigger fonksiyonunu da gerçek package_price kullanacak şekilde güncelle
CREATE OR REPLACE FUNCTION public.add_specialist_to_customers_on_activate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sadece is_active false -> true geçişlerinde
  IF (OLD.is_active IS DISTINCT FROM true) AND NEW.is_active = true THEN
    IF NEW.email IS NULL OR NEW.email = '' THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.automatic_orders (
      customer_name, customer_email, customer_phone, package_name, package_type,
      amount, payment_method, customer_type, registration_date, monthly_payment_day,
      total_months, paid_months, is_active, customer_city
    )
    SELECT
      NEW.name, NEW.email, COALESCE(NEW.phone, '0 216 706 06 11'),
      COALESCE(NEW.specialty, 'Uzman') || ' Paketi',
      LOWER(REPLACE(COALESCE(NEW.specialty, 'uzman'), ' ', '_')),
      COALESCE(NEW.package_price, 3000),
      'banka_havalesi', 'individual', NOW(),
      COALESCE(NEW.payment_day, 1), 24,
      ARRAY[]::integer[], true, NEW.city
    WHERE NOT EXISTS (
      SELECT 1 FROM public.automatic_orders ao WHERE ao.customer_email = NEW.email
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 5) Pasif olunca müşteri listesinden çıkar
CREATE OR REPLACE FUNCTION public.remove_specialist_from_customers_on_deactivate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.is_active = true AND (NEW.is_active IS DISTINCT FROM true) THEN
    IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
      DELETE FROM public.automatic_orders WHERE customer_email = NEW.email;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_remove_specialist_from_customers_on_deactivate ON public.specialists;
CREATE TRIGGER trigger_remove_specialist_from_customers_on_deactivate
AFTER UPDATE OF is_active ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.remove_specialist_from_customers_on_deactivate();

-- 6) Uzman silinince müşteri listesinden çıkar
CREATE OR REPLACE FUNCTION public.remove_specialist_from_customers_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.email IS NOT NULL AND OLD.email <> '' THEN
    DELETE FROM public.automatic_orders WHERE customer_email = OLD.email;
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_remove_specialist_from_customers_on_delete ON public.specialists;
CREATE TRIGGER trigger_remove_specialist_from_customers_on_delete
AFTER DELETE ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.remove_specialist_from_customers_on_delete();

-- 7) Uzman package_price güncellenince müşteri amount'u senkron olsun
CREATE OR REPLACE FUNCTION public.sync_specialist_amount_to_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;
  IF COALESCE(OLD.package_price, -1) IS DISTINCT FROM COALESCE(NEW.package_price, -1) THEN
    UPDATE public.automatic_orders
    SET amount = COALESCE(NEW.package_price, 3000),
        updated_at = NOW()
    WHERE customer_email = NEW.email;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_sync_specialist_amount_to_customers ON public.specialists;
CREATE TRIGGER trigger_sync_specialist_amount_to_customers
AFTER UPDATE OF package_price ON public.specialists
FOR EACH ROW
EXECUTE FUNCTION public.sync_specialist_amount_to_customers();
