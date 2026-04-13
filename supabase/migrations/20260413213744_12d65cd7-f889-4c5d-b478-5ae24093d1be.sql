
-- 1. Remove any remaining anon SELECT on specialists
DROP POLICY IF EXISTS "Public can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Anyone can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Anon can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Anon view active specialists" ON public.specialists;

-- 2. Fix website_analytics unrestricted UPDATE
DROP POLICY IF EXISTS "Anyone can update analytics" ON public.website_analytics;
DROP POLICY IF EXISTS "Public can update analytics" ON public.website_analytics;
DROP POLICY IF EXISTS "Anon can update analytics" ON public.website_analytics;
DROP POLICY IF EXISTS "Anyone can update own session" ON public.website_analytics;

CREATE POLICY "Scoped analytics update"
ON public.website_analytics FOR UPDATE
USING (last_active > now() - interval '30 minutes')
WITH CHECK (true);
