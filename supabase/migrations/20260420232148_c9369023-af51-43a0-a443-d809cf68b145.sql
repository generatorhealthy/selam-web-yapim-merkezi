-- Eski uzmanların telefon numaralarını siparişlerden çek
-- Email eşleşmesi ile (case-insensitive)

-- 1) user_profiles tablosunu güncelle (kullanıcı listesinde göstermek için)
UPDATE public.user_profiles up
SET 
  phone = sub.customer_phone,
  updated_at = now()
FROM (
  SELECT DISTINCT ON (LOWER(o.customer_email))
    LOWER(o.customer_email) AS email_lower,
    o.customer_phone
  FROM public.orders o
  WHERE o.customer_phone IS NOT NULL 
    AND TRIM(o.customer_phone) != ''
    AND o.customer_email IS NOT NULL
  ORDER BY LOWER(o.customer_email), o.created_at DESC
) sub
WHERE LOWER(up.email) = sub.email_lower
  AND up.role = 'specialist'
  AND (up.phone IS NULL OR TRIM(up.phone) = '');

-- 2) specialists tablosunu güncelle (telefonla giriş için OTP bu tabloya bakıyor)
UPDATE public.specialists s
SET 
  phone = sub.customer_phone,
  updated_at = now()
FROM (
  SELECT DISTINCT ON (LOWER(o.customer_email))
    LOWER(o.customer_email) AS email_lower,
    o.customer_phone
  FROM public.orders o
  WHERE o.customer_phone IS NOT NULL 
    AND TRIM(o.customer_phone) != ''
    AND o.customer_email IS NOT NULL
  ORDER BY LOWER(o.customer_email), o.created_at DESC
) sub
WHERE LOWER(s.email) = sub.email_lower
  AND (s.phone IS NULL OR TRIM(s.phone) = '');