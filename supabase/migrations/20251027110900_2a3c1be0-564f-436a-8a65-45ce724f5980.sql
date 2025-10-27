-- Fix specialist creation error by removing ON CONFLICT requirements from trigger functions
-- 1) Replace create_client_referral_for_new_specialist to avoid ON CONFLICT
CREATE OR REPLACE FUNCTION public.create_client_referral_for_new_specialist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Yeni eklenen uzman için mevcut ay ve yıl için kayıt oluştur (unique indexe ihtiyaç duymadan)
  INSERT INTO public.client_referrals (specialist_id, year, month)
  SELECT NEW.id,
         EXTRACT(YEAR FROM NOW())::int,
         EXTRACT(MONTH FROM NOW())::int
  WHERE NOT EXISTS (
    SELECT 1 FROM public.client_referrals cr
    WHERE cr.specialist_id = NEW.id
      AND cr.year = EXTRACT(YEAR FROM NOW())::int
      AND cr.month = EXTRACT(MONTH FROM NOW())::int
  );
  
  RETURN NEW;
END;
$$;

-- 2) Replace add_specialist_to_customers to avoid ON CONFLICT
CREATE OR REPLACE FUNCTION public.add_specialist_to_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  -- Varsayılan e-posta değeri hazırla
  v_email := COALESCE(NEW.email, NEW.name || '@example.com');

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
    3000, -- Varsayılan fiyat, sonradan manuel olarak güncellenecek
    'banka_havalesi',
    'individual',
    NOW(),
    1,
    24,
    ARRAY[]::integer[], -- Başlangıçta hiç ödeme yok, sonradan manuel olarak güncellenecek
    true,
    NULL, -- address
    NEW.city,
    NULL, -- tc
    NULL, -- company name
    NULL, -- tax no
    NULL  -- tax office
  WHERE NOT EXISTS (
    SELECT 1 FROM public.automatic_orders ao
    WHERE ao.customer_email = v_email
  );

  RETURN NEW;
END;
$$;