
-- Restore deleted staff user: Sıla Kayadibi (dodok@doktorumol.com.tr, id: a08f89f0-7097-47c9-8d27-06672df5ad52)

-- 1) Recreate the auth user with a temporary password
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a08f89f0-7097-47c9-8d27-06672df5ad52',
  'authenticated',
  'authenticated',
  'dodok@doktorumol.com.tr',
  crypt('Sila2026!', gen_salt('bf')),
  now(), '2026-07-20 08:17:20.539014+00', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- 2) Recreate user_profiles row from backup
INSERT INTO public.user_profiles (id, user_id, name, email, phone, role, is_approved, created_at, updated_at)
SELECT id, user_id, name, email, phone, role, is_approved, created_at, updated_at
FROM public.backup_1784822400_user_profiles
WHERE user_id = 'a08f89f0-7097-47c9-8d27-06672df5ad52'
ON CONFLICT (user_id) DO NOTHING;

-- 3) Restore client_referrals rows attributed to this staff user
INSERT INTO public.client_referrals (
  id, specialist_id, year, month, is_referred, referred_at, referred_by, notes,
  created_at, updated_at, referral_count, client_name, client_surname, client_contact, consultation_type
)
SELECT id, specialist_id, year, month, is_referred, referred_at, referred_by, notes,
       created_at, updated_at, referral_count, client_name, client_surname, client_contact, consultation_type
FROM public.backup_1784822400_client_referrals
WHERE referred_by = 'a08f89f0-7097-47c9-8d27-06672df5ad52'
ON CONFLICT (id) DO NOTHING;
