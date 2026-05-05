-- 1) Auth user'ı yeniden oluştur
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '68be3b65-0120-4bab-a615-eb6c0ed5bc1b',
  'authenticated', 'authenticated',
  'onur_gurle@icloud.com',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"OnurGurle"}'::jsonb,
  '2025-12-12 08:42:44+00', now(),
  '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- 2) Trigger ile oluşmuş olabilecek boş profili kaldır
DELETE FROM public.user_profiles WHERE user_id='68be3b65-0120-4bab-a615-eb6c0ed5bc1b';

-- 3) Yedekten tam profili geri yükle
INSERT INTO public.user_profiles
SELECT * FROM public.backup_1777996800_user_profiles
WHERE user_id = '68be3b65-0120-4bab-a615-eb6c0ed5bc1b';

-- 4) Uzman kaydını geri yükle
INSERT INTO public.specialists
SELECT * FROM public.backup_1777996800_specialists
WHERE id = '451ccb29-8ec4-4f27-b635-a492f978c8bd'
ON CONFLICT (id) DO NOTHING;

-- 5) Blog yazısını geri yükle
INSERT INTO public.blog_posts
SELECT * FROM public.backup_1777996800_blog_posts
WHERE specialist_id = '451ccb29-8ec4-4f27-b635-a492f978c8bd'
ON CONFLICT (id) DO NOTHING;