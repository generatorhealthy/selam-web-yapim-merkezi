INSERT INTO public.specialists
SELECT * FROM public.backup_1778256001_specialists
WHERE email = 'zhumaevaamina2@gmail.com'
ON CONFLICT (id) DO NOTHING;

UPDATE public.user_profiles up
SET name = b.name,
    role = b.role,
    is_approved = b.is_approved,
    phone = COALESCE(up.phone, b.phone)
FROM public.backup_1778256001_user_profiles b
WHERE up.user_id = '2aad9056-1078-419e-aff9-eaf005b72aa0'
  AND b.email = 'zhumaevaamina2@gmail.com';