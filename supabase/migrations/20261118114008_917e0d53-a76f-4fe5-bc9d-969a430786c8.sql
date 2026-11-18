-- lovable-cron-fallback-reviewed: bounded queue wakes on enqueue and pauses immediately after drain; pending offline sender needs retry, maximum 1440 runs/day only while pending
CREATE FUNCTION public.reels_stop_if_drained() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$DECLARE jid bigint;BEGIN
IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service required' USING ERRCODE='42501';END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('enes-queue-schedule',0));
IF NOT EXISTS(SELECT 1 FROM public.reels_jobs WHERE notice_status='pending') THEN SELECT jobid INTO jid FROM cron.job WHERE jobname='enes-pending-notices-20261118';IF jid IS NOT NULL THEN PERFORM cron.alter_job(jid,active:=false);END IF;END IF;END $$;
REVOKE ALL ON FUNCTION public.reels_stop_if_drained() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reels_stop_if_drained() TO service_role;
CREATE OR REPLACE FUNCTION public.wake_enes_specialist_notice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$DECLARE relevant boolean:=false;jid bigint;BEGIN
IF TG_TABLE_NAME='specialists' THEN relevant:=NEW.created_at>='2026-11-18T11:22:00Z'::timestamptz AND NEW.is_active AND NEW.slug IS NOT NULL AND EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(NEW.email)) AND o.deleted_at IS NULL AND o.status IN ('pending','approved','completed'));
ELSIF TG_TABLE_NAME='orders' THEN relevant:=NEW.deleted_at IS NULL AND NEW.status IN ('pending','approved','completed') AND EXISTS(SELECT 1 FROM public.specialists s WHERE s.created_at>='2026-11-18T11:22:00Z'::timestamptz AND s.is_active AND s.slug IS NOT NULL AND lower(trim(s.email))=lower(trim(NEW.customer_email)));
END IF;
IF relevant THEN
PERFORM public.reels_sync_jobs(false);
IF EXISTS(SELECT 1 FROM public.reels_jobs WHERE notice_status='pending') THEN
PERFORM pg_advisory_xact_lock(hashtextextended('enes-queue-schedule',0));
SELECT jobid INTO jid FROM cron.job WHERE jobname='enes-pending-notices-20261118';
IF jid IS NULL THEN PERFORM cron.schedule('enes-pending-notices-20261118','* * * * *',$job$SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/reels-notify',headers:=jsonb_build_object('Content-Type','application/json','x-internal-cron-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='internal_cron_token' LIMIT 1)),body:='{}'::jsonb,timeout_milliseconds:=55000);$job$);ELSE PERFORM cron.alter_job(jid,active:=true);END IF;
PERFORM net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/reels-notify',headers:=jsonb_build_object('Content-Type','application/json','x-internal-cron-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='internal_cron_token' LIMIT 1)),body:='{}'::jsonb,timeout_milliseconds:=55000);
END IF;END IF;
RETURN NEW;EXCEPTION WHEN OTHERS THEN RETURN NEW;END $$;