
-- Trigger: Sipariş onaylandığında otomatik olarak müşteri yönetiminde ilgili ayı işaretle
CREATE OR REPLACE FUNCTION public.mark_paid_month_on_order_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_automatic_order RECORD;
  v_subscription_month integer;
  v_current_paid_months integer[];
BEGIN
  -- Sadece status approved veya completed olduğunda çalış
  IF NEW.status IN ('approved', 'completed') AND OLD.status NOT IN ('approved', 'completed') THEN
    v_subscription_month := COALESCE(NEW.subscription_month, 1);
    
    -- Email ile automatic_orders tablosunda müşteriyi bul
    SELECT id, paid_months INTO v_automatic_order
    FROM public.automatic_orders
    WHERE customer_email = NEW.customer_email
    LIMIT 1;
    
    IF v_automatic_order.id IS NOT NULL THEN
      v_current_paid_months := COALESCE(v_automatic_order.paid_months, ARRAY[]::integer[]);
      
      -- Eğer bu ay henüz işaretlenmemişse ekle
      IF NOT (v_subscription_month = ANY(v_current_paid_months)) THEN
        UPDATE public.automatic_orders
        SET paid_months = array_sort(array_append(v_current_paid_months, v_subscription_month)),
            updated_at = NOW()
        WHERE id = v_automatic_order.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- array_sort helper function
CREATE OR REPLACE FUNCTION public.array_sort(anyarray)
RETURNS anyarray
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT array_agg(x ORDER BY x) FROM unnest($1) x;
$function$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_mark_paid_month_on_order_approval ON public.orders;
CREATE TRIGGER trigger_mark_paid_month_on_order_approval
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.mark_paid_month_on_order_approval();

-- Fix: add_specialist_to_customers trigger - example email yerine gerçek email kullan
CREATE OR REPLACE FUNCTION public.add_specialist_to_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  -- Email boşsa ekleme yapma, example email kullanma
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;
  
  v_email := NEW.email;

  -- Yeni eklenen uzmanı müşteri yönetimine ekle (duplicate olmayacak şekilde)
  INSERT INTO public.automatic_orders (
    customer_name,
    customer_email,
    customer_phone,
    package_name,
    package_type,
    amount,
    payment_method,
    customer_type,
    registration_date,
    monthly_payment_day,
    total_months,
    paid_months,
    is_active,
    customer_address,
    customer_city,
    customer_tc_no,
    company_name,
    company_tax_no,
    company_tax_office
  )
  SELECT
    NEW.name,
    v_email,
    COALESCE(NEW.phone, '0 216 706 06 11'),
    NEW.specialty || ' Paketi',
    LOWER(REPLACE(NEW.specialty, ' ', '_')),
    3000,
    'banka_havalesi',
    'individual',
    NOW(),
    1,
    24,
    ARRAY[]::integer[],
    true,
    NULL,
    NEW.city,
    NULL,
    NULL,
    NULL,
    NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.automatic_orders ao
    WHERE ao.customer_email = v_email
  );

  RETURN NEW;
END;
$function$;

-- Mevcut example email'leri düzelt: specialists tablosundaki gerçek email ile güncelle
UPDATE public.automatic_orders ao
SET customer_email = s.email,
    updated_at = NOW()
FROM public.specialists s
WHERE ao.customer_email LIKE '%@example.com'
  AND s.name = ao.customer_name
  AND s.email IS NOT NULL
  AND s.email != '';
