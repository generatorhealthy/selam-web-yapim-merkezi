
-- Şirket numarasını (0216 706 0611) uzmanlardan temizle ve siparişlerdeki gerçek numaralarla değiştir
WITH company_pattern AS (
  SELECT ARRAY['02167060611','905337060611','5337060611','902167060611','9002167060611'] AS nums
),
real_phones AS (
  SELECT DISTINCT ON (LOWER(o.customer_email))
    LOWER(o.customer_email) AS email_lower,
    o.customer_phone
  FROM public.orders o, company_pattern cp
  WHERE o.customer_phone IS NOT NULL 
    AND TRIM(o.customer_phone) != ''
    AND o.customer_email IS NOT NULL
    AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g') != ALL(cp.nums)
    AND o.customer_phone NOT ILIKE '%706%0611%'
  ORDER BY LOWER(o.customer_email), o.created_at DESC
)
-- 1) specialists tablosunu güncelle
UPDATE public.specialists s
SET phone = rp.customer_phone, updated_at = now()
FROM real_phones rp, company_pattern cp
WHERE LOWER(s.email) = rp.email_lower
  AND (regexp_replace(COALESCE(s.phone,''), '[^0-9]', '', 'g') = ANY(cp.nums) 
       OR s.phone ILIKE '%706%0611%');

-- 2) user_profiles tablosunu güncelle
WITH company_pattern AS (
  SELECT ARRAY['02167060611','905337060611','5337060611','902167060611','9002167060611'] AS nums
),
real_phones AS (
  SELECT DISTINCT ON (LOWER(o.customer_email))
    LOWER(o.customer_email) AS email_lower,
    o.customer_phone
  FROM public.orders o, company_pattern cp
  WHERE o.customer_phone IS NOT NULL 
    AND TRIM(o.customer_phone) != ''
    AND o.customer_email IS NOT NULL
    AND regexp_replace(o.customer_phone, '[^0-9]', '', 'g') != ALL(cp.nums)
    AND o.customer_phone NOT ILIKE '%706%0611%'
  ORDER BY LOWER(o.customer_email), o.created_at DESC
)
UPDATE public.user_profiles up
SET phone = rp.customer_phone, updated_at = now()
FROM real_phones rp, company_pattern cp
WHERE LOWER(up.email) = rp.email_lower
  AND up.role = 'specialist'
  AND (regexp_replace(COALESCE(up.phone,''), '[^0-9]', '', 'g') = ANY(cp.nums) 
       OR up.phone ILIKE '%706%0611%');

-- 3) Gerçek numarası bulunamayanları NULL yap (şirket numarasını temizle)
UPDATE public.specialists 
SET phone = NULL, updated_at = now()
WHERE regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') IN ('02167060611','905337060611','5337060611','902167060611','9002167060611')
   OR phone ILIKE '%706%0611%';

UPDATE public.user_profiles 
SET phone = NULL, updated_at = now()
WHERE role = 'specialist' 
  AND (regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') IN ('02167060611','905337060611','5337060611','902167060611','9002167060611')
       OR phone ILIKE '%706%0611%');
