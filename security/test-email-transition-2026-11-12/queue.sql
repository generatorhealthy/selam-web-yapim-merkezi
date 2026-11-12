-- PACKAGE B CANDIDATE ONLY: no historical result backfill, no cron/network, no result RLS changes.
BEGIN;
CREATE TABLE public.test_notice_queue_v1 (
 result_id uuid NOT NULL REFERENCES public.test_results(id) ON DELETE RESTRICT,
 channel text NOT NULL CHECK(channel IN ('email','sms','push')),
 status text NOT NULL CHECK(status IN ('held_legacy','pending','sending','sent','failed','unknown')),
 attempt_id uuid, provider_id text, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(result_id,channel)
);
GRANT ALL ON public.test_notice_queue_v1 TO service_role;
ALTER TABLE public.test_notice_queue_v1 ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_submit_operations_v1 (
 operation_id uuid PRIMARY KEY, result_id uuid UNIQUE NOT NULL REFERENCES public.test_results(id) ON DELETE RESTRICT,
 payload_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.test_submit_operations_v1 TO service_role;
ALTER TABLE public.test_submit_operations_v1 ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.enqueue_test_email_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- Legacy guest INSERT is not authenticated provenance; keep result, hold mail until safe migration.
 INSERT INTO public.test_notice_queue_v1(result_id,channel,status)
 VALUES(NEW.id,'email','held_legacy') ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_test_email_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_test_email_v1() TO service_role;
CREATE TRIGGER enqueue_test_email_v1 AFTER INSERT ON public.test_results
 FOR EACH ROW EXECUTE FUNCTION public.enqueue_test_email_v1();

-- This server RPC is a future submit adapter target, not connected to current forms.
-- Caller MUST have verified consent/operation and identity before invoking; not a consent replacement.
CREATE FUNCTION public.commit_test_result_v1(p_operation uuid,p_test uuid,p_specialist uuid,p_patient uuid,
 p_name text,p_contact text,p_answers jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE prior public.test_submit_operations_v1; rid uuid; digest text;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF p_operation IS NULL OR p_patient IS NULL OR p_answers IS NULL OR jsonb_typeof(p_answers)<>'object'
 OR length(trim(COALESCE(p_name,''))) NOT BETWEEN 1 AND 200
 OR length(trim(COALESCE(p_contact,''))) NOT BETWEEN 1 AND 254
 OR octet_length(p_answers::text)>65536 THEN RAISE EXCEPTION 'invalid request'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation::text,0));
 digest:=encode(sha256(convert_to(jsonb_build_array(p_test,p_specialist,p_patient,p_name,p_contact,p_answers)::text,'UTF8')),'hex');
 SELECT * INTO prior FROM public.test_submit_operations_v1 WHERE operation_id=p_operation;
 IF FOUND THEN
  IF prior.payload_hash IS DISTINCT FROM digest THEN RAISE EXCEPTION 'operation conflict'; END IF;
  RETURN prior.result_id;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.specialists s JOIN public.tests t ON t.id=p_test
  WHERE s.id=p_specialist AND s.user_id IS NOT NULL AND s.is_active AND t.is_active
  AND (t.specialist_id=s.id OR EXISTS(SELECT 1 FROM public.specialist_tests st
   WHERE st.test_id=t.id AND st.specialist_id=s.id AND st.is_enabled)))
 THEN RAISE EXCEPTION 'specialist mapping denied' USING ERRCODE='42501'; END IF;
 INSERT INTO public.test_results(test_id,specialist_id,patient_user_id,patient_name,patient_email,answers,results,status)
 VALUES(p_test,p_specialist,p_patient,p_name,p_contact,p_answers,
  '{"interpretation":"specialist_review_required"}'::jsonb,'completed') RETURNING id INTO rid;
 INSERT INTO public.test_submit_operations_v1(operation_id,result_id,payload_hash) VALUES(p_operation,rid,digest);
 UPDATE public.test_notice_queue_v1 SET status='pending' WHERE result_id=rid;
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.commit_test_result_v1(uuid,uuid,uuid,uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_test_result_v1(uuid,uuid,uuid,uuid,text,text,jsonb) TO service_role;

CREATE FUNCTION public.claim_test_notice_v1(p_channel text) RETURNS TABLE(result_id uuid,attempt_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF p_channel NOT IN ('email','sms','push') THEN RAISE EXCEPTION 'invalid channel'; END IF;
 RETURN QUERY WITH picked AS (
 SELECT q.result_id FROM public.test_notice_queue_v1 q WHERE q.channel=p_channel AND q.status='pending'
 ORDER BY q.created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
 UPDATE public.test_notice_queue_v1 q SET status='sending',attempt_id=gen_random_uuid(),updated_at=now()
 FROM picked p WHERE q.result_id=p.result_id AND q.channel=p_channel RETURNING q.result_id,q.attempt_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_test_notice_v1(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_test_notice_v1(text) TO service_role;
CREATE FUNCTION public.finish_test_notice_v1(p_result uuid,p_channel text,p_attempt uuid,p_status text,p_provider text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE n int;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF p_status NOT IN ('sent','failed','unknown') OR p_status IS NULL THEN RAISE EXCEPTION 'invalid state'; END IF;
 UPDATE public.test_notice_queue_v1 SET status=p_status,provider_id=left(p_provider,200),updated_at=now()
 WHERE result_id=p_result AND channel=p_channel AND attempt_id=p_attempt AND status='sending';
 GET DIAGNOSTICS n=ROW_COUNT; RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.finish_test_notice_v1(uuid,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_test_notice_v1(uuid,text,uuid,text,text) TO service_role;
COMMIT;