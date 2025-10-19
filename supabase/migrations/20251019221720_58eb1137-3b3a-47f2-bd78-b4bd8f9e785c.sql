-- Tüm otomatik siparişleri aktif et
UPDATE public.automatic_orders
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false;

-- Şenay Esen için bilgileri düzelt
UPDATE public.automatic_orders
SET customer_email = 'sensenay07@gmail.com',
    amount = 2998,
    is_active = true,
    monthly_payment_day = 20,
    paid_months = ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9],
    current_month = 10,
    updated_at = NOW()
WHERE customer_name ILIKE '%Şenay Esen%' OR customer_name ILIKE '%Senay Esen%';

-- Bugün (19 Ekim) ödeme günü olan tüm uzmanlar için sipariş oluştur
INSERT INTO public.orders (
  customer_name,
  customer_email,
  customer_phone,
  package_name,
  package_type,
  amount,
  status,
  payment_method,
  customer_type,
  customer_address,
  customer_city,
  customer_tc_no,
  company_name,
  company_tax_no,
  company_tax_office,
  is_first_order,
  subscription_month,
  contract_ip_address
)
SELECT 
  ao.customer_name,
  ao.customer_email,
  ao.customer_phone,
  ao.package_name,
  ao.package_type,
  ao.amount,
  'pending',
  ao.payment_method,
  ao.customer_type,
  ao.customer_address,
  ao.customer_city,
  ao.customer_tc_no,
  ao.company_name,
  ao.company_tax_no,
  ao.company_tax_office,
  false,
  ao.current_month + 1,
  '127.0.0.1'
FROM public.automatic_orders ao
WHERE ao.is_active = true
  AND ao.monthly_payment_day = 19
  AND ao.current_month < ao.total_months
  AND NOT (ao.current_month + 1 = ANY(ao.paid_months))
  AND NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.customer_email = ao.customer_email
      AND o.subscription_month = ao.current_month + 1
      AND o.deleted_at IS NULL
      AND DATE(o.created_at) = CURRENT_DATE
  );

-- Şenay Esen için özel sipariş oluştur (10. ay)
INSERT INTO public.orders (
  customer_name,
  customer_email,
  customer_phone,
  package_name,
  package_type,
  amount,
  status,
  payment_method,
  customer_type,
  customer_address,
  customer_city,
  customer_tc_no,
  company_name,
  company_tax_no,
  company_tax_office,
  is_first_order,
  subscription_month,
  contract_ip_address
)
SELECT 
  ao.customer_name,
  ao.customer_email,
  ao.customer_phone,
  ao.package_name,
  ao.package_type,
  ao.amount,
  'pending',
  ao.payment_method,
  ao.customer_type,
  ao.customer_address,
  ao.customer_city,
  ao.customer_tc_no,
  ao.company_name,
  ao.company_tax_no,
  ao.company_tax_office,
  false,
  10, -- 10. ay
  '127.0.0.1'
FROM public.automatic_orders ao
WHERE (ao.customer_name ILIKE '%Şenay Esen%' OR ao.customer_name ILIKE '%Senay Esen%')
  AND NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.customer_email = ao.customer_email
      AND o.subscription_month = 10
      AND o.deleted_at IS NULL
  )
LIMIT 1;

-- Current_month'u güncelle
UPDATE public.automatic_orders
SET current_month = current_month + 1,
    updated_at = NOW()
WHERE is_active = true
  AND monthly_payment_day = 19
  AND current_month < total_months;