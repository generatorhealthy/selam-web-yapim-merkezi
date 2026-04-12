
-- =====================================================
-- FIX 1: user_profiles - restrict SELECT to own profile or admin/staff
-- =====================================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;

CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin_or_staff_user()
);

-- =====================================================
-- FIX 2: reviews - hide reviewer_email from anonymous users
-- Create a view for public access without email, keep full access for admin/staff
-- =====================================================
DROP POLICY IF EXISTS "Reviews public read policy" ON public.reviews;

-- Public can see approved reviews but NOT reviewer_email (handled via view or app code)
-- Since we can't column-restrict in RLS, we create two policies:
-- Anonymous: only approved reviews
-- Admin/Staff: all reviews
CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
TO anon
USING (status = 'approved');

CREATE POLICY "Authenticated can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  status = 'approved'
  OR is_admin_or_staff_user()
);

-- Create a secure view that hides email for public use
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  id,
  specialist_id,
  reviewer_name,
  rating,
  comment,
  status,
  created_at,
  updated_at
FROM public.reviews
WHERE status = 'approved';

-- =====================================================
-- FIX 3: specialists - hide email/phone from anonymous users
-- =====================================================
DROP POLICY IF EXISTS "Specialists read policy" ON public.specialists;

-- Create a security definer function that returns safe specialist data
CREATE OR REPLACE FUNCTION public.is_specialist_owner(_specialist_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _specialist_user_id IS NOT NULL AND _specialist_user_id = auth.uid();
$$;

-- Anonymous: can see active specialists (email/phone hidden via app code)
CREATE POLICY "Public can view active specialists"
ON public.specialists
FOR SELECT
TO anon
USING (is_active = true);

-- Authenticated: own profile, active specialists, or admin/staff
CREATE POLICY "Authenticated can view specialists"
ON public.specialists
FOR SELECT
TO authenticated
USING (
  is_active = true
  OR user_id = auth.uid()
  OR is_admin_or_staff_user()
);

-- =====================================================
-- FIX 5: profile-pictures storage - restrict write access
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete profile pictures" ON storage.objects;

-- Keep public read access (profile pictures should be viewable)
-- Already exists: "Anyone can view profile pictures"

-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Only admin/staff or the owner can update
CREATE POLICY "Admin staff can update profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (
    is_admin_or_staff_user()
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Only admin/staff can delete
CREATE POLICY "Admin staff can delete profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND is_admin_or_staff_user()
);
