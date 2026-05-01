-- 1) Tighten registration_analytics UPDATE policy with session ownership check
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'registration_analytics' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.registration_analytics', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Update own session analytics"
ON public.registration_analytics
FOR UPDATE
TO anon, authenticated
USING (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
)
WITH CHECK (
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
);

-- 2) Remove website_analytics from realtime publication to prevent IP/session leak
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'website_analytics'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.website_analytics';
  END IF;
END $$;