CREATE TABLE public.reels_team_members (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reels_team_members TO authenticated;
GRANT ALL ON public.reels_team_members TO service_role;
ALTER TABLE public.reels_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY reels_team_admin ON public.reels_team_members FOR ALL TO authenticated
 USING(public.is_admin_user()) WITH CHECK(public.is_admin_user());
CREATE POLICY reels_team_self ON public.reels_team_members FOR SELECT TO authenticated USING(user_id=auth.uid());

CREATE FUNCTION public.has_reels_team_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.reels_team_members WHERE user_id=auth.uid() AND active);
$$;
REVOKE ALL ON FUNCTION public.has_reels_team_access() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_reels_team_access() TO authenticated,service_role;

CREATE FUNCTION public.reels_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
 BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER reels_member_updated BEFORE UPDATE ON public.reels_team_members FOR EACH ROW EXECUTE FUNCTION public.reels_touch_updated_at();

-- A team account has no legacy panel role. Restrictive policies prevent other
-- permissive policies from accidentally exposing application tables to it.
DO $$DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public'
 AND tablename NOT IN ('reels_team_members','user_profiles') LOOP
 EXECUTE format('CREATE POLICY reels_team_isolation ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.has_reels_team_access()) WITH CHECK (NOT public.has_reels_team_access())',t.tablename);
 END LOOP;
END $$;
CREATE POLICY reels_team_profile_read ON public.user_profiles AS RESTRICTIVE FOR SELECT TO authenticated
 USING(NOT public.has_reels_team_access() OR user_id=auth.uid());
CREATE POLICY reels_team_profile_insert ON public.user_profiles AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(NOT public.has_reels_team_access());
CREATE POLICY reels_team_profile_update ON public.user_profiles AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(NOT public.has_reels_team_access()) WITH CHECK(NOT public.has_reels_team_access());
CREATE POLICY reels_team_profile_delete ON public.user_profiles AS RESTRICTIVE FOR DELETE TO authenticated
 USING(NOT public.has_reels_team_access());

-- All video transport is server-verified; no team Storage API writes or reads.
CREATE POLICY reels_team_storage_isolation ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
 USING(NOT public.has_reels_team_access()) WITH CHECK(NOT public.has_reels_team_access());