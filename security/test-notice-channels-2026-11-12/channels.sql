-- PACKAGE C ONLY, after B queue substrate approval. No network/cron in trigger.
BEGIN;
CREATE OR REPLACE FUNCTION public.notify_specialist_new_test_result() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 INSERT INTO public.test_notice_queue_v1(result_id,channel,status)
 VALUES(NEW.id,'sms','held_legacy'),(NEW.id,'push','held_legacy') ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.notify_specialist_new_test_result() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.notify_specialist_new_test_result() TO service_role;
-- Existing trg_notify_specialist_new_test_result binding stays in place. No historical replay.
COMMIT;