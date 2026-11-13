CREATE TABLE public.admin_login_challenge_claims (
  nonce_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_login_challenge_claims TO service_role;
ALTER TABLE public.admin_login_challenge_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_only_login_claims ON public.admin_login_challenge_claims TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.consume_admin_login_challenge(p_nonce_hash text, p_expires_at timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inserted_count integer;
BEGIN
  IF NOT (session_user IN ('postgres','supabase_admin') OR current_setting('role',true) = 'service_role') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_nonce_hash !~ '^[a-f0-9]{64}$' OR p_expires_at <= now() OR p_expires_at > now() + interval '6 minutes' THEN
    RETURN false;
  END IF;
  INSERT INTO public.admin_login_challenge_claims(nonce_hash,expires_at) VALUES(p_nonce_hash,p_expires_at) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  DELETE FROM public.admin_login_challenge_claims WHERE expires_at < now() - interval '1 day';
  RETURN inserted_count = 1;
END; $$;
REVOKE EXECUTE ON FUNCTION public.consume_admin_login_challenge(text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_admin_login_challenge(text,timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.check_admin_login_block(p_email text)
RETURNS TABLE(is_blocked boolean,blocked_until timestamptz,attempts_remaining integer)
LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$ SELECT false,NULL::timestamptz,3; $$;
CREATE OR REPLACE FUNCTION public.record_failed_admin_login(p_email text,p_ip_address text DEFAULT NULL)
RETURNS TABLE(is_now_blocked boolean,blocked_until timestamptz,attempts_remaining integer)
LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$ SELECT false,NULL::timestamptz,3; $$;
REVOKE EXECUTE ON FUNCTION public.record_failed_admin_login(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_admin_login(text,text) TO service_role;