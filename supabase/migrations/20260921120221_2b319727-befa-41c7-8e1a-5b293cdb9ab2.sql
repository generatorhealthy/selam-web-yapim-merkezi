DROP POLICY IF EXISTS "Recent session analytics update" ON public.website_analytics;
CREATE POLICY "Session analytics update" ON public.website_analytics
FOR UPDATE
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);