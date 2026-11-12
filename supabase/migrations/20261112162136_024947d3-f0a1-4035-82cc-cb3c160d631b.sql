BEGIN;
REVOKE UPDATE, DELETE ON public.user_consent_logs FROM anon, authenticated;
REVOKE SELECT ON public.user_consent_logs FROM anon;
GRANT SELECT ON public.user_consent_logs TO authenticated;
GRANT SELECT, INSERT ON public.user_consent_logs TO service_role;
DROP POLICY IF EXISTS "Users can view their own consent logs" ON public.user_consent_logs;
CREATE POLICY "Users can view their own consent logs" ON public.user_consent_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
COMMIT;