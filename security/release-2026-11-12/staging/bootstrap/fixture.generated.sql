BEGIN;
-- ISOLATED MINIMAL FIXTURE: not a production schema clone or a deployable migration.
-- auth.uid() is supplied by real Supabase, or a separate local test stub.
CREATE TABLE public.specialists(id uuid PRIMARY KEY,user_id uuid,email text,is_active boolean);
GRANT ALL ON public.specialists TO service_role;
GRANT SELECT ON public.specialists TO authenticated;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_specialist_read ON public.specialists FOR SELECT TO authenticated USING(user_id=auth.uid());

CREATE TABLE public.tests(id uuid PRIMARY KEY,specialist_id uuid REFERENCES public.specialists(id),is_active boolean);
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.specialist_tests(test_id uuid REFERENCES public.tests(id),specialist_id uuid REFERENCES public.specialists(id),is_enabled boolean);
GRANT ALL ON public.specialist_tests TO service_role;
ALTER TABLE public.specialist_tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.test_questions(id uuid PRIMARY KEY,test_id uuid REFERENCES public.tests(id),question_type text,options jsonb,is_required boolean,step_number int);
GRANT ALL ON public.test_questions TO service_role;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.test_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),test_id uuid REFERENCES public.tests(id),specialist_id uuid REFERENCES public.specialists(id),patient_user_id uuid,patient_name text,patient_email text,answers jsonb,results jsonb,status text);
GRANT ALL ON public.test_results TO service_role;
GRANT SELECT ON public.test_results TO authenticated;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_result_read ON public.test_results FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.specialists s WHERE s.id=test_results.specialist_id AND s.user_id=auth.uid()));

CREATE TABLE public.user_consent_logs(id uuid PRIMARY KEY,user_id uuid,consent_type text,consent_version text,document_hash text,accepted boolean,accepted_at timestamptz,source text,ip_address text,metadata jsonb);
GRANT SELECT,INSERT ON public.user_consent_logs TO service_role;
ALTER TABLE public.user_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.appointments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),specialist_id uuid REFERENCES public.specialists(id),patient_user_id uuid,notes text,consultation_topic text);
GRANT ALL ON public.appointments TO service_role;
GRANT SELECT ON public.appointments TO authenticated;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_appointment_read ON public.appointments FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.specialists s WHERE s.id=appointments.specialist_id AND s.user_id=auth.uid()));

CREATE TABLE public.simulated_deliveries(event_key text PRIMARY KEY,channel text NOT NULL,created_at timestamptz DEFAULT now());
GRANT ALL ON public.simulated_deliveries TO service_role;
ALTER TABLE public.simulated_deliveries ENABLE ROW LEVEL SECURITY;
-- DRAFT ONLY. Separate approval and real mobile migration required. No historic INSERT/UPDATE/DELETE.

CREATE TABLE public.verified_consent_documents (
 purpose text NOT NULL, version text NOT NULL, document_text text NOT NULL, document_hash text NOT NULL,
 published boolean NOT NULL DEFAULT false, PRIMARY KEY(purpose,version)
);
GRANT ALL ON public.verified_consent_documents TO service_role;
ALTER TABLE public.verified_consent_documents ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.verified_consent_operations (
 id uuid PRIMARY KEY, user_id uuid NOT NULL, purpose text NOT NULL, action text NOT NULL,
 version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), log_id uuid NOT NULL UNIQUE,
 FOREIGN KEY(purpose,version) REFERENCES public.verified_consent_documents(purpose,version)
);
GRANT ALL ON public.verified_consent_operations TO service_role;
ALTER TABLE public.verified_consent_operations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.verified_consent_current (
 user_id uuid NOT NULL,purpose text NOT NULL,log_id uuid,action text NOT NULL DEFAULT 'decline',
 version text,document_hash text,PRIMARY KEY(user_id,purpose)
);
GRANT ALL ON public.verified_consent_current TO service_role;
ALTER TABLE public.verified_consent_current ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.record_verified_consent(p_user uuid,p_operation uuid,p_purpose text,p_action text,p_version text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE doc public.verified_consent_documents; old public.verified_consent_operations; event uuid:=gen_random_uuid();
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'service required' USING ERRCODE='42501'; END IF;
 IF p_user IS NULL OR p_operation IS NULL OR p_purpose NOT IN ('health_test','health_appointment','sms_marketing','email_marketing','phone_marketing','analytics','ads') OR p_action NOT IN ('grant','decline','withdraw') THEN RAISE EXCEPTION 'invalid consent'; END IF;
 -- Serialize grants/withdrawals and all future collection transactions on the same key.
 INSERT INTO public.verified_consent_current(user_id,purpose) VALUES(p_user,p_purpose) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.verified_consent_current WHERE user_id=p_user AND purpose=p_purpose FOR UPDATE;
 SELECT * INTO old FROM public.verified_consent_operations WHERE id=p_operation;
 IF FOUND THEN
  IF old.user_id<>p_user OR old.purpose<>p_purpose OR old.action<>p_action OR old.version<>p_version THEN RAISE EXCEPTION 'operation conflict'; END IF;
  RETURN old.log_id;
 END IF;
 SELECT * INTO doc FROM public.verified_consent_documents WHERE purpose=p_purpose AND version=p_version FOR SHARE;
 IF NOT FOUND OR NOT doc.published OR doc.document_text='' THEN RAISE EXCEPTION 'document not published'; END IF;
 -- sha256 is computed from server-selected text, never accepted from callers/catalog imports.
 doc.document_hash := encode(sha256(convert_to(doc.document_text,'UTF8')),'hex');
 INSERT INTO public.user_consent_logs(id,user_id,consent_type,consent_version,document_hash,accepted,accepted_at,source,ip_address,metadata)
 VALUES(event,p_user,p_purpose,p_version,doc.document_hash,p_action='grant',now(),'verified_server',NULL,jsonb_build_object('action',p_action,'transaction_id',p_operation,'purpose',p_purpose,'text',doc.document_text,'ip_verification','unavailable'));
 INSERT INTO public.verified_consent_operations(id,user_id,purpose,action,version,log_id) VALUES(p_operation,p_user,p_purpose,p_action,p_version,event);
 UPDATE public.verified_consent_current SET log_id=event,action=p_action,version=p_version,document_hash=doc.document_hash WHERE user_id=p_user AND purpose=p_purpose;
 RETURN event;
END $$;
REVOKE ALL ON FUNCTION public.record_verified_consent(uuid,uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_verified_consent(uuid,uuid,text,text,text) TO service_role;
CREATE FUNCTION public.prevent_consent_history_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'Consent history is append-only'; END $$;
CREATE TRIGGER verified_consent_append_only BEFORE UPDATE OR DELETE ON public.user_consent_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_consent_history_mutation();
-- Direct INSERT grants deliberately remain unchanged until real mobile migration acceptance.

-- DRAFT: apply after consent-draft.sql only in isolated tests / approved migration.
-- Withdrawal uses the previous verified event snapshot even if catalog is unpublished.
CREATE FUNCTION public.withdraw_verified_consent(p_user uuid,p_operation uuid,p_purpose text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE cur public.verified_consent_current; old public.user_consent_logs; previous public.verified_consent_operations; event uuid:=gen_random_uuid();
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF p_user IS NULL OR p_operation IS NULL THEN RAISE EXCEPTION 'invalid identity'; END IF;
 SELECT * INTO cur FROM public.verified_consent_current WHERE user_id=p_user AND purpose=p_purpose FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'no verified consent history'; END IF;
 SELECT * INTO previous FROM public.verified_consent_operations WHERE id=p_operation;
 IF FOUND THEN
  IF previous.user_id IS DISTINCT FROM p_user OR previous.purpose IS DISTINCT FROM p_purpose OR previous.action<>'withdraw' THEN RAISE EXCEPTION 'operation conflict'; END IF;
  RETURN previous.log_id;
 END IF;
 SELECT * INTO old FROM public.user_consent_logs WHERE id=cur.log_id AND user_id=p_user;
 IF NOT FOUND THEN RAISE EXCEPTION 'missing verified snapshot'; END IF;
 INSERT INTO public.user_consent_logs(id,user_id,consent_type,consent_version,document_hash,accepted,accepted_at,source,ip_address,metadata)
 VALUES(event,p_user,p_purpose,old.consent_version,old.document_hash,false,now(),'verified_server',NULL,jsonb_build_object('action','withdraw','transaction_id',p_operation,'purpose',p_purpose,'text',old.metadata->>'text','previous_event',old.id));
 INSERT INTO public.verified_consent_operations(id,user_id,purpose,action,version,log_id) VALUES(p_operation,p_user,p_purpose,'withdraw',old.consent_version,event);
 UPDATE public.verified_consent_current SET log_id=event,action='withdraw' WHERE user_id=p_user AND purpose=p_purpose;
 RETURN event;
END $$;
REVOKE ALL ON FUNCTION public.withdraw_verified_consent(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_verified_consent(uuid,uuid,text) TO service_role;
-- ISOLATED RELEASE DRAFT. Apply only through migration tool after separate approval.

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

-- No replay/backfill of the existing 12 results; no direct INSERT revoke until every client migrates.
-- Isolated candidate: quotas disabled until staging operator sets reviewed values.
CREATE TABLE public.test_prepare_limits(id boolean PRIMARY KEY DEFAULT true,max_requests integer NOT NULL,window_seconds integer NOT NULL);
GRANT ALL ON public.test_prepare_limits TO service_role;
ALTER TABLE public.test_prepare_limits ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_prepare_budgets(key text NOT NULL,bucket bigint NOT NULL,used integer NOT NULL DEFAULT 0,PRIMARY KEY(key,bucket));
GRANT ALL ON public.test_prepare_budgets TO service_role;
ALTER TABLE public.test_prepare_budgets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_prepare_proofs(hash text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.test_prepare_proofs TO service_role;
ALTER TABLE public.test_prepare_proofs ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_test_prepare_budget(p_key text,p_proof text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE cfg public.test_prepare_limits; used_count integer; b bigint;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server only' USING ERRCODE='42501'; END IF;
 SELECT * INTO cfg FROM public.test_prepare_limits WHERE id FOR SHARE;
 IF NOT FOUND OR cfg.max_requests<1 OR cfg.window_seconds<1 OR p_key !~ '^[a-f0-9]{64}$' OR p_proof !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
 INSERT INTO public.test_prepare_proofs(hash) VALUES(p_proof) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN false; END IF;
 b:=floor(extract(epoch FROM now())/cfg.window_seconds);
 INSERT INTO public.test_prepare_budgets(key,bucket,used) VALUES(p_key,b,1)
 ON CONFLICT(key,bucket) DO UPDATE SET used=test_prepare_budgets.used+1 WHERE test_prepare_budgets.used<cfg.max_requests RETURNING used INTO used_count;
 RETURN used_count IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.consume_test_prepare_budget(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_test_prepare_budget(text,text) TO service_role;
-- Minimal test fixture: no HTTP or provider transport; not the live appointment schema.
CREATE FUNCTION public.fixture_create_appointment(p_id uuid,p_specialist uuid,p_user uuid,p_health boolean,p_notes text,p_topic text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=p_specialist AND is_active) THEN RAISE EXCEPTION 'specialist unavailable'; END IF;
 IF p_health THEN
  PERFORM 1 FROM public.verified_consent_current WHERE user_id=p_user AND purpose='health_appointment' AND action='grant' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'scoped consent required'; END IF;
 END IF;
 INSERT INTO public.appointments(id,specialist_id,patient_user_id,notes,consultation_topic)
 VALUES(p_id,p_specialist,p_user,CASE WHEN p_health THEN p_notes END,CASE WHEN p_health THEN p_topic END);
 INSERT INTO public.simulated_deliveries(event_key,channel) VALUES(p_id::text,'appointment');
 RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION public.fixture_create_appointment(uuid,uuid,uuid,boolean,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fixture_create_appointment(uuid,uuid,uuid,boolean,text,text) TO service_role;
COMMIT;
