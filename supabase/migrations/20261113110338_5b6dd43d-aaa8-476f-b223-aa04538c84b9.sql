REVOKE EXECUTE ON FUNCTION public.cleanup_old_sessions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invoke_twitter_share_after_may1() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_search_engines_async(text, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reset_admin_login_attempts(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR lower(coalesce(auth.jwt()->>'email','')) <> lower(trim(p_email)) THEN
    RAISE EXCEPTION 'Yetkisiz';
  END IF;
  UPDATE public.admin_login_attempts
     SET attempt_count = 0, is_blocked = false, blocked_until = NULL, last_attempt_at = NOW()
   WHERE email = LOWER(trim(p_email));
END; $$;
REVOKE EXECUTE ON FUNCTION public.reset_admin_login_attempts(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_admin_login_attempts(text) TO authenticated, service_role;