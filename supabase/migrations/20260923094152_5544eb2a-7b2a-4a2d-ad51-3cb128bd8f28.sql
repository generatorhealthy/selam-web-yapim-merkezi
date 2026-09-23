DROP POLICY IF EXISTS "Update own session analytics" ON public.registration_analytics;

CREATE POLICY "Update recent session analytics"
ON public.registration_analytics
FOR UPDATE
TO anon, authenticated
USING (session_id IS NOT NULL AND created_at > now() - interval '2 days')
WITH CHECK (session_id IS NOT NULL);