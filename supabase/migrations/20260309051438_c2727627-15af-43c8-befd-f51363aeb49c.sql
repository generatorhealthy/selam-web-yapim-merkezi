-- Update Merve Önen's role from 'staff' to 'user' since she left
UPDATE public.user_profiles
SET role = 'user'
WHERE email = 'merveonen@doktorumol.com.tr' AND role = 'staff';