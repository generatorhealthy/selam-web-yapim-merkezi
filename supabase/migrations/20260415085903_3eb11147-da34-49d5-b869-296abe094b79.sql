UPDATE public.user_profiles up
SET phone = s.phone
FROM public.specialists s
WHERE s.user_id = up.user_id
  AND s.phone IS NOT NULL 
  AND s.phone != ''
  AND s.phone != '0 216 706 06 11'
  AND (up.phone IS NULL OR up.phone = '');