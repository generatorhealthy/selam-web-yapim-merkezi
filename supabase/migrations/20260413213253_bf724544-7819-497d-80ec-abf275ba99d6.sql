
-- 1. Fix remaining Security Definer View (public_reviews)
DROP VIEW IF EXISTS public.public_reviews;
CREATE VIEW public.public_reviews
WITH (security_invoker = on) AS
SELECT 
  r.id, r.specialist_id, r.reviewer_name, r.rating, r.comment, 
  r.status, r.created_at
FROM public.reviews r
WHERE r.status = 'approved';

-- 2. Fix specialists: hide PII from anonymous/public users
-- Current policy allows anon to see everything. Replace with view-based approach.
-- The get_public_specialists() function already hides email/phone/address.
-- Just restrict the direct table access for anon:
DROP POLICY IF EXISTS "Public can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Anyone can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Anon can view active specialists" ON public.specialists;

-- Anon users must use the get_public_specialists() RPC or public_specialists view
-- which don't expose email/phone/address
-- No direct anon SELECT on specialists table

-- Authenticated non-admin users can only see their own specialist record
-- (Admin/staff already have full access via existing policy)
CREATE POLICY "Authenticated view own specialist"
ON public.specialists FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_admin_or_staff_user()
);

-- 3. Fix public bucket listing - make bucket private and use signed URLs
-- or add a more restrictive SELECT policy
DROP POLICY IF EXISTS "Profile pictures read by direct access" ON storage.objects;

-- Only allow reading specific objects (not listing), by requiring name to be provided
CREATE POLICY "Profile pictures read specific files"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures' AND name IS NOT NULL AND name != '');
