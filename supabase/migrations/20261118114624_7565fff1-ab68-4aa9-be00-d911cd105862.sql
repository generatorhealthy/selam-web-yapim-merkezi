ALTER TABLE public.specialist_profile_videos ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')), ADD COLUMN reviewed_by uuid, ADD COLUMN reviewed_at timestamptz;
CREATE OR REPLACE FUNCTION public.review_profile_video(p_actor uuid,p_video uuid,p_decision text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=p_actor AND role='admin' AND is_approved=true) THEN RAISE EXCEPTION 'admin required' USING ERRCODE='42501'; END IF;
IF p_decision IS NULL OR p_decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'invalid decision'; END IF;
UPDATE public.specialist_profile_videos SET moderation_status=p_decision,reviewed_by=p_actor,reviewed_at=now(),updated_at=now() WHERE id=p_video AND status='ready' AND moderation_status='pending';
RETURN FOUND; END $$;
REVOKE ALL ON FUNCTION public.review_profile_video(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_profile_video(uuid,uuid,text) TO service_role;