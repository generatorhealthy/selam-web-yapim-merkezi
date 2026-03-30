-- Grant permissions for registration_analytics table
GRANT SELECT ON public.registration_analytics TO authenticated;
GRANT INSERT ON public.registration_analytics TO anon, authenticated;
GRANT UPDATE ON public.registration_analytics TO anon, authenticated;

-- Also update RLS policies to include anon for insert and update
DROP POLICY IF EXISTS "Anyone can insert registration analytics" ON public.registration_analytics;
CREATE POLICY "Anyone can insert registration analytics" ON public.registration_analytics
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update own session analytics" ON public.registration_analytics;
CREATE POLICY "Anyone can update own session analytics" ON public.registration_analytics
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);