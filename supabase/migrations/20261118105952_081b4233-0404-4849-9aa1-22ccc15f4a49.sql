ALTER FUNCTION public.has_reels_team_access() SECURITY INVOKER;
DROP POLICY reels_team_admin ON public.reels_team_members;
DROP POLICY reels_team_self ON public.reels_team_members;
CREATE POLICY reels_team_read ON public.reels_team_members FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin_user());
CREATE POLICY reels_team_insert ON public.reels_team_members FOR INSERT TO authenticated WITH CHECK(public.is_admin_user());
CREATE POLICY reels_team_update ON public.reels_team_members FOR UPDATE TO authenticated USING(public.is_admin_user()) WITH CHECK(public.is_admin_user());
CREATE POLICY reels_team_delete ON public.reels_team_members FOR DELETE TO authenticated USING(public.is_admin_user());