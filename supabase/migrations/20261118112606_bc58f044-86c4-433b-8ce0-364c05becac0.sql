CREATE OR REPLACE FUNCTION public.reels_sync_jobs(p_baseline boolean DEFAULT false) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$DECLARE added integer;BEGIN
IF current_setting('role',true) IS DISTINCT FROM 'service_role' AND NOT(session_user='postgres' AND current_setting('role',true) IN ('none','postgres')) THEN RAISE EXCEPTION 'service required' USING ERRCODE='42501';END IF;
INSERT INTO public.reels_jobs(specialist_id,notice_status) SELECT s.id,'pending' FROM public.specialists s WHERE s.created_at>='2026-11-18T11:22:00Z'::timestamptz AND s.is_active AND s.slug IS NOT NULL AND s.user_id IS NOT NULL AND nullif(trim(s.email),'') IS NOT NULL AND EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(s.email)) AND o.deleted_at IS NULL AND o.status IN ('pending','approved','completed')) AND (SELECT count(*) FROM public.specialists x WHERE lower(trim(x.email))=lower(trim(s.email)))=1 ON CONFLICT(specialist_id) DO NOTHING;
GET DIAGNOSTICS added=ROW_COUNT;RETURN added;END $$;
REVOKE ALL ON FUNCTION public.reels_sync_jobs(boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reels_sync_jobs(boolean) TO service_role;
CREATE OR REPLACE FUNCTION public.reels_claim_notice() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$DECLARE picked public.reels_jobs;s public.specialists;BEGIN
IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service required' USING ERRCODE='42501';END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('reels-notice-global',0));
IF EXISTS(SELECT 1 FROM public.reels_jobs WHERE notice_claimed_at>now()-interval '1 minute') THEN RETURN NULL;END IF;
SELECT j.* INTO picked FROM public.reels_jobs j JOIN public.specialists sp ON sp.id=j.specialist_id WHERE j.notice_status='pending' AND sp.created_at>='2026-11-18T11:22:00Z'::timestamptz AND sp.is_active AND sp.slug IS NOT NULL AND sp.user_id IS NOT NULL AND (SELECT count(*) FROM public.specialists x WHERE lower(trim(x.email))=lower(trim(sp.email)))=1 AND EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(sp.email)) AND o.deleted_at IS NULL AND o.status IN ('pending','approved','completed')) ORDER BY j.created_at,j.id LIMIT 1 FOR UPDATE OF j SKIP LOCKED;
IF picked.id IS NULL THEN RETURN NULL;END IF;
SELECT * INTO s FROM public.specialists WHERE id=picked.specialist_id;
UPDATE public.reels_jobs SET notice_status='unknown',notice_claimed_at=now() WHERE id=picked.id;
RETURN jsonb_build_object('id',picked.id,'name',s.name,'slug',s.slug,'specialty',s.specialty);END $$;
REVOKE ALL ON FUNCTION public.reels_claim_notice() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reels_claim_notice() TO service_role;