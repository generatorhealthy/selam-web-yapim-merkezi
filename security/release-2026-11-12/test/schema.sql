-- ISOLATED RELEASE DRAFT. Apply only through migration tool after separate approval.
BEGIN;
CREATE TABLE public.test_submission_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), test_id uuid NOT NULL REFERENCES public.tests(id),
 specialist_id uuid NOT NULL REFERENCES public.specialists(id), user_id uuid,
 capability_hash text NOT NULL, consent_log_id uuid, guest_declared boolean NOT NULL DEFAULT false,
 guest_document_version text,guest_document_hash text,guest_document_text text,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '2 hours',
 result_id uuid UNIQUE REFERENCES public.test_results(id), payload_hash text
);
GRANT ALL ON public.test_submission_operations TO service_role;
ALTER TABLE public.test_submission_operations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_result_outbox (
 result_id uuid PRIMARY KEY REFERENCES public.test_results(id), status text NOT NULL DEFAULT 'pending',
 attempt_id uuid, provider_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.test_result_outbox TO service_role;
ALTER TABLE public.test_result_outbox ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.prepare_test_submission(p_test uuid,p_specialist uuid,p_user uuid,p_hash text,p_guest_declared boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE t public.tests; sid uuid; event uuid; operation uuid; doc public.verified_consent_documents; docs int;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid capability'; END IF;
 SELECT * INTO t FROM public.tests WHERE id=p_test AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'test unavailable'; END IF;
 sid:=COALESCE(p_specialist,t.specialist_id);
 IF sid IS NULL OR NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=sid AND is_active)
 OR NOT (t.specialist_id=sid OR EXISTS(SELECT 1 FROM public.specialist_tests WHERE test_id=p_test AND specialist_id=sid AND is_enabled))
 THEN RAISE EXCEPTION 'test specialist mismatch'; END IF;
 IF p_user IS NOT NULL THEN
  SELECT log_id INTO event FROM public.verified_consent_current WHERE user_id=p_user AND purpose='health_test' AND action='grant' FOR UPDATE;
  IF event IS NULL THEN RAISE EXCEPTION 'scoped consent required'; END IF;
 ELSE
  SELECT count(*) INTO docs FROM public.verified_consent_documents WHERE purpose='health_test' AND published;
  IF p_guest_declared IS DISTINCT FROM true OR docs<>1
  THEN RAISE EXCEPTION 'guest declaration or published document required'; END IF;
  SELECT * INTO doc FROM public.verified_consent_documents WHERE purpose='health_test' AND published FOR SHARE;
 END IF;
 INSERT INTO public.test_submission_operations(test_id,specialist_id,user_id,capability_hash,consent_log_id,guest_declared,guest_document_version,guest_document_hash,guest_document_text)
 VALUES(p_test,sid,p_user,p_hash,event,p_user IS NULL AND p_guest_declared,doc.version,encode(sha256(convert_to(doc.document_text,'UTF8')),'hex'),doc.document_text) RETURNING id INTO operation;
 RETURN operation;
END $$;
REVOKE ALL ON FUNCTION public.prepare_test_submission(uuid,uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_test_submission(uuid,uuid,uuid,text,boolean) TO service_role;
CREATE FUNCTION public.commit_test_submission(p_operation uuid,p_hash text,p_user uuid,p_name text,p_contact text,p_answers jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE op public.test_submission_operations; rid uuid; digest text; answered int; total int; q record; a jsonb;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 -- Same lock order as withdrawal/prepare; no health write after revoked consent.
 IF p_user IS NOT NULL THEN
  PERFORM 1 FROM public.verified_consent_current WHERE user_id=p_user AND purpose='health_test' AND action='grant' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'scoped consent required'; END IF;
 END IF;
 SELECT * INTO op FROM public.test_submission_operations WHERE id=p_operation FOR UPDATE;
 IF NOT FOUND OR op.capability_hash IS DISTINCT FROM p_hash OR op.user_id IS DISTINCT FROM p_user THEN RAISE EXCEPTION 'operation denied' USING ERRCODE='42501'; END IF;
 IF p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' OR octet_length(p_answers::text)>65536
 OR length(trim(COALESCE(p_name,''))) NOT BETWEEN 1 AND 200 OR length(trim(COALESCE(p_contact,''))) NOT BETWEEN 1 AND 254 THEN RAISE EXCEPTION 'invalid input'; END IF;
 digest:=encode(sha256(convert_to(jsonb_build_array(p_name,p_contact,p_answers)::text,'UTF8')),'hex');
 IF op.result_id IS NOT NULL THEN
  IF op.payload_hash IS DISTINCT FROM digest THEN RAISE EXCEPTION 'operation payload conflict'; END IF;
  RETURN op.result_id;
 END IF;
 IF now()>=op.expires_at THEN RAISE EXCEPTION 'operation expired'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tests t WHERE t.id=op.test_id AND t.is_active AND
 (t.specialist_id=op.specialist_id OR EXISTS(SELECT 1 FROM public.specialist_tests st WHERE st.test_id=t.id AND st.specialist_id=op.specialist_id AND st.is_enabled)))
 OR NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=op.specialist_id AND is_active) THEN RAISE EXCEPTION 'test mapping changed'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_answers) k WHERE NOT EXISTS(SELECT 1 FROM public.test_questions WHERE test_id=op.test_id AND id::text=k)) THEN RAISE EXCEPTION 'unknown answer'; END IF;
 total:=0;answered:=0;
 FOR q IN SELECT * FROM public.test_questions WHERE test_id=op.test_id ORDER BY step_number LOOP
  total:=total+1;a:=p_answers->q.id::text;
  IF q.is_required AND (a IS NULL OR a='null'::jsonb OR a='""'::jsonb) THEN RAISE EXCEPTION 'required answer'; END IF;
  IF a IS NOT NULL THEN
   answered:=answered+1;
   IF q.question_type='multiple_choice' THEN
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) x WHERE x=a OR x->>'text'=a#>>'{}' OR x->>'value'=a#>>'{}') THEN RAISE EXCEPTION 'invalid option'; END IF;
   ELSIF q.question_type='scale' THEN
    IF jsonb_typeof(a)<>'number' OR (a#>>'{}')::numeric NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'invalid scale'; END IF;
   ELSIF jsonb_typeof(a)<>'string' OR length(a#>>'{}')>4000 THEN RAISE EXCEPTION 'invalid text'; END IF;
  END IF;
 END LOOP;
 IF total=0 THEN RAISE EXCEPTION 'empty test'; END IF;
 INSERT INTO public.test_results(test_id,specialist_id,patient_user_id,patient_name,patient_email,answers,results,status)
 VALUES(op.test_id,op.specialist_id,p_user,p_name,p_contact,p_answers,jsonb_build_object('answeredQuestions',answered,'totalQuestions',total,'completionRate',round(answered*100.0/total),'interpretation','specialist_review_required'),'completed') RETURNING id INTO rid;
 UPDATE public.test_submission_operations SET result_id=rid,payload_hash=digest WHERE id=op.id;
 INSERT INTO public.test_result_outbox(result_id) VALUES(rid);
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.commit_test_submission(uuid,text,uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_test_submission(uuid,text,uuid,text,text,jsonb) TO service_role;
CREATE FUNCTION public.claim_test_result_notice() RETURNS TABLE(result_id uuid,attempt_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 RETURN QUERY WITH picked AS (SELECT o.result_id FROM public.test_result_outbox o WHERE status IN ('pending','retryable') ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
 UPDATE public.test_result_outbox o SET status='sending',attempt_id=gen_random_uuid(),updated_at=now() FROM picked p WHERE o.result_id=p.result_id RETURNING o.result_id,o.attempt_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_test_result_notice() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_test_result_notice() TO service_role;
CREATE FUNCTION public.finish_test_result_notice(p_result uuid,p_attempt uuid,p_status text,p_provider text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE n int;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('sent','failed','retryable','unknown') THEN RAISE EXCEPTION 'invalid state'; END IF;
 UPDATE public.test_result_outbox SET status=p_status,provider_id=left(p_provider,200),updated_at=now() WHERE result_id=p_result AND attempt_id=p_attempt AND status='sending';
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n=1;
END $$;
REVOKE ALL ON FUNCTION public.finish_test_result_notice(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_test_result_notice(uuid,uuid,text,text) TO service_role;
COMMIT;
-- No replay/backfill of the existing 12 results; no direct INSERT revoke until every client migrates.