CREATE TABLE public.panel_gate_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  totp_secret text,
  pending_secret text,
  backup_code_hashes text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.panel_gate_config TO service_role;
ALTER TABLE public.panel_gate_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.panel_gate_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.panel_gate_sessions (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX panel_gate_sessions_user_idx ON public.panel_gate_sessions(user_id);
GRANT ALL ON public.panel_gate_sessions TO service_role;
ALTER TABLE public.panel_gate_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.panel_gate_failures (
  key text PRIMARY KEY,
  failures int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.panel_gate_failures TO service_role;
ALTER TABLE public.panel_gate_failures ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.panel_gate_ok()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NULL
      OR NOT COALESCE((SELECT enabled FROM public.panel_gate_config WHERE id = 1), false)
      OR NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid()
                     AND role IN ('admin','staff','legal','muhasebe','partner'))
      OR EXISTS (SELECT 1 FROM public.panel_gate_sessions s
                 WHERE s.user_id = auth.uid()
                   AND s.session_id::text = (auth.jwt() ->> 'session_id')
                   AND s.expires_at > now());
$$;
GRANT EXECUTE ON FUNCTION public.panel_gate_ok() TO anon, authenticated, service_role;

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
             AND c.relname NOT IN ('panel_gate_config','panel_gate_sessions','panel_gate_failures') LOOP
    EXECUTE format('DROP POLICY IF EXISTS panel_gate_required ON public.%I', t.relname);
    IF t.relname = 'user_profiles' THEN
      EXECUTE 'CREATE POLICY panel_gate_required ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.panel_gate_ok()) OR user_id = (SELECT auth.uid())) WITH CHECK ((SELECT public.panel_gate_ok()) OR user_id = (SELECT auth.uid()))';
    ELSE
      EXECUTE format('CREATE POLICY panel_gate_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.panel_gate_ok())) WITH CHECK ((SELECT public.panel_gate_ok()))', t.relname);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS panel_gate_required ON storage.objects;
CREATE POLICY panel_gate_required ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT public.panel_gate_ok())) WITH CHECK ((SELECT public.panel_gate_ok()));