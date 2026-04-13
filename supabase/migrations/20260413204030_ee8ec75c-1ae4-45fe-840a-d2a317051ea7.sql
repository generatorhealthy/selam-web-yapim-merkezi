
-- 1) Remove the anonymous SELECT policy on reviews (force use of public_reviews view)
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

-- 2) Update authenticated policy to only show reviewer_email to admin/staff
-- Keep existing policy for authenticated users (they need it for admin panel)
-- The public_reviews view already excludes reviewer_email for public access

-- 3) Create a function to check admin/staff for realtime
CREATE OR REPLACE FUNCTION public.is_admin_or_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'staff')
    AND is_approved = true
  );
$$;

-- 4) Add RLS policy on realtime.messages to restrict channel subscriptions
-- Note: We cannot modify realtime schema directly, but we can secure the website_analytics table
-- by ensuring only admin/staff can subscribe to its realtime changes

-- Ensure website_analytics has proper SELECT restriction for realtime
DROP POLICY IF EXISTS "Allow analytics tracking inserts" ON public.website_analytics;
DROP POLICY IF EXISTS "Allow analytics session updates" ON public.website_analytics;
DROP POLICY IF EXISTS "Allow update for own session analytics" ON public.website_analytics;
DROP POLICY IF EXISTS "Anyone can view analytics" ON public.website_analytics;
DROP POLICY IF EXISTS "Admin can view analytics" ON public.website_analytics;

-- Re-create INSERT policy (anonymous tracking)
CREATE POLICY "Allow analytics tracking inserts"
ON public.website_analytics FOR INSERT
WITH CHECK (true);

-- Re-create UPDATE policy (session updates)  
CREATE POLICY "Allow analytics session updates"
ON public.website_analytics FOR UPDATE
USING (true) WITH CHECK (true);

-- SELECT only for admin/staff (prevents realtime eavesdropping)
CREATE POLICY "Admin staff can view analytics"
ON public.website_analytics FOR SELECT TO authenticated
USING (public.is_admin_or_staff_user());

-- DELETE only for admin
CREATE POLICY "Admin can delete analytics"
ON public.website_analytics FOR DELETE TO authenticated
USING (public.is_admin_or_staff_user());
