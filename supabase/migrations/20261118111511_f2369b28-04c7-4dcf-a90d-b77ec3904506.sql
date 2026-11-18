CREATE TABLE public.specialist_profile_videos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,uploaded_by uuid NOT NULL,storage_path text UNIQUE NOT NULL,filename text NOT NULL,mime_type text NOT NULL,byte_size bigint NOT NULL,status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.specialist_profile_videos TO service_role;
ALTER TABLE public.specialist_profile_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_video_service ON public.specialist_profile_videos FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE INDEX profile_video_specialist ON public.specialist_profile_videos(specialist_id,created_at);
CREATE TRIGGER profile_video_updated BEFORE UPDATE ON public.specialist_profile_videos FOR EACH ROW EXECUTE FUNCTION public.reels_touch_updated_at();
CREATE FUNCTION public.reserve_profile_video(p_actor uuid,p_specialist uuid,p_filename text,p_mime text,p_size bigint) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$DECLARE v_id uuid:=gen_random_uuid(); BEGIN
IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service required' USING ERRCODE='42501';END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('profile-videos:'||p_specialist::text,0));
IF NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=p_specialist AND user_id=p_actor AND is_active) THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501';END IF;
IF p_filename IS NULL OR length(p_filename)>200 OR p_mime NOT IN ('video/mp4','video/quicktime','video/webm') OR p_size IS NULL OR p_size<17 OR p_size>52428800 THEN RAISE EXCEPTION 'invalid video' USING ERRCODE='22023';END IF;
UPDATE public.specialist_profile_videos SET status='expired' WHERE specialist_id=p_specialist AND status='pending' AND created_at<now()-interval '1 hour';
IF (SELECT count(*) FROM public.specialist_profile_videos WHERE specialist_id=p_specialist AND status IN ('pending','validating','ready'))>=6 THEN RAISE EXCEPTION 'En fazla 6 video ekleyebilirsiniz' USING ERRCODE='54000';END IF;
INSERT INTO public.specialist_profile_videos(id,specialist_id,uploaded_by,storage_path,filename,mime_type,byte_size) VALUES(v_id,p_specialist,p_actor,'quarantine/'||p_specialist::text||'/'||v_id::text,p_filename,p_mime,p_size);RETURN v_id;END $$;
REVOKE ALL ON FUNCTION public.reserve_profile_video(uuid,uuid,text,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_profile_video(uuid,uuid,text,text,bigint) TO service_role;
CREATE POLICY profile_video_storage_boundary ON storage.objects AS RESTRICTIVE FOR ALL TO anon,authenticated USING(bucket_id<>'profile-videos') WITH CHECK(bucket_id<>'profile-videos');