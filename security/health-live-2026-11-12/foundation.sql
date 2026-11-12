-- Additive, inactive foundation. No legacy result/consent row changes and no notification changes.
CREATE TABLE public.health_test_release (
 singleton boolean PRIMARY KEY DEFAULT true,
 enabled boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.health_test_release TO service_role;
ALTER TABLE public.health_test_release ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.health_test_documents (
 version text PRIMARY KEY, disclosure text NOT NULL, consent text NOT NULL,
 legal_approved_at timestamptz, published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.health_test_documents TO service_role;
ALTER TABLE public.health_test_documents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.health_test_operations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 test_id uuid NOT NULL REFERENCES public.tests(id), specialist_id uuid NOT NULL REFERENCES public.specialists(id),
 capability_hash text NOT NULL, document_version text NOT NULL REFERENCES public.health_test_documents(version),
 disclosure_hash text NOT NULL, consent_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '2 hours',
 withdrawn_at timestamptz, result_id uuid UNIQUE REFERENCES public.test_results(id), payload_hash text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.health_test_operations TO service_role;
ALTER TABLE public.health_test_operations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.health_test_consent_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), operation_id uuid NOT NULL REFERENCES public.health_test_operations(id),
 user_id uuid NOT NULL, purpose text NOT NULL, action text NOT NULL,
 document_version text NOT NULL, document_hash text NOT NULL, document_text text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(), UNIQUE(operation_id,purpose,action)
);
GRANT SELECT, INSERT ON public.health_test_consent_events TO service_role;
ALTER TABLE public.health_test_consent_events ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.health_test_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN RAISE EXCEPTION 'health evidence is immutable' USING ERRCODE='42501'; END $$;
REVOKE ALL ON FUNCTION public.health_test_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER health_test_documents_immutable BEFORE UPDATE OR DELETE ON public.health_test_documents
FOR EACH ROW EXECUTE FUNCTION public.health_test_immutable();
CREATE TRIGGER health_test_events_immutable BEFORE UPDATE OR DELETE ON public.health_test_consent_events
FOR EACH ROW EXECUTE FUNCTION public.health_test_immutable();

CREATE FUNCTION public.health_test_prepare(p_user uuid,p_test uuid,p_specialist uuid,p_capability_hash text,p_version text,p_disclosure_hash text,p_consent_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE doc public.health_test_documents; t public.tests; sid uuid; op uuid;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR p_user IS NULL THEN RAISE EXCEPTION 'verified server required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.health_test_release WHERE singleton AND enabled) THEN RAISE EXCEPTION 'health release unavailable'; END IF;
 IF p_capability_hash IS NULL OR p_capability_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid capability'; END IF;
 SELECT * INTO doc FROM public.health_test_documents WHERE version=p_version AND legal_approved_at IS NOT NULL AND published_at<=now() FOR SHARE;
 IF NOT FOUND OR p_disclosure_hash IS DISTINCT FROM encode(sha256(convert_to(doc.disclosure,'UTF8')),'hex') OR p_consent_hash IS DISTINCT FROM encode(sha256(convert_to(doc.consent,'UTF8')),'hex') THEN RAISE EXCEPTION 'approved document required'; END IF;
 SELECT * INTO t FROM public.tests WHERE id=p_test AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'test unavailable'; END IF;
 sid:=COALESCE(p_specialist,t.specialist_id);
 IF sid IS NULL OR NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=sid AND is_active)
 OR NOT (t.specialist_id=sid OR EXISTS(SELECT 1 FROM public.specialist_tests WHERE test_id=p_test AND specialist_id=sid AND is_enabled)) THEN RAISE EXCEPTION 'test specialist mismatch'; END IF;
 INSERT INTO public.health_test_operations(user_id,test_id,specialist_id,capability_hash,document_version,disclosure_hash,consent_hash)
 VALUES(p_user,p_test,sid,p_capability_hash,p_version,p_disclosure_hash,p_consent_hash) RETURNING id INTO op;
 INSERT INTO public.health_test_consent_events(operation_id,user_id,purpose,action,document_version,document_hash,document_text)
 VALUES(op,p_user,'test_disclosure','acknowledge',doc.version,p_disclosure_hash,doc.disclosure),
 (op,p_user,'health_test','grant',doc.version,p_consent_hash,doc.consent);
 RETURN op;
END $$;
REVOKE ALL ON FUNCTION public.health_test_prepare(uuid,uuid,uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.health_test_prepare(uuid,uuid,uuid,text,text,text,text) TO service_role;

CREATE FUNCTION public.health_test_commit(p_user uuid,p_operation uuid,p_capability_hash text,p_name text,p_contact text,p_answers jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE op public.health_test_operations; rid uuid; digest text; q record; a jsonb; total int:=0; answered int:=0;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR p_user IS NULL THEN RAISE EXCEPTION 'verified server required' USING ERRCODE='42501'; END IF;
 SELECT * INTO op FROM public.health_test_operations WHERE id=p_operation FOR UPDATE;
 IF NOT FOUND OR op.user_id IS DISTINCT FROM p_user OR op.capability_hash IS DISTINCT FROM p_capability_hash THEN RAISE EXCEPTION 'operation denied' USING ERRCODE='42501'; END IF;
 IF p_answers IS NULL OR jsonb_typeof(p_answers)<>'object' OR octet_length(p_answers::text)>65536
 OR length(trim(COALESCE(p_name,''))) NOT BETWEEN 1 AND 200 OR length(trim(COALESCE(p_contact,''))) NOT BETWEEN 1 AND 254 THEN RAISE EXCEPTION 'invalid input'; END IF;
 digest:=encode(sha256(convert_to(jsonb_build_array(p_name,p_contact,p_answers)::text,'UTF8')),'hex');
 IF op.result_id IS NOT NULL THEN
  IF op.payload_hash IS DISTINCT FROM digest THEN RAISE EXCEPTION 'operation payload conflict'; END IF;
  RETURN op.result_id;
 END IF;
 IF op.withdrawn_at IS NOT NULL OR now()>=op.expires_at OR NOT EXISTS(SELECT 1 FROM public.health_test_release WHERE singleton AND enabled)
 OR NOT EXISTS(SELECT 1 FROM public.health_test_consent_events WHERE operation_id=op.id AND user_id=p_user AND purpose='health_test' AND action='grant' AND document_hash=op.consent_hash)
 THEN RAISE EXCEPTION 'valid test consent required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tests t WHERE t.id=op.test_id AND t.is_active AND (t.specialist_id=op.specialist_id OR EXISTS(SELECT 1 FROM public.specialist_tests st WHERE st.test_id=t.id AND st.specialist_id=op.specialist_id AND st.is_enabled)))
 OR NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=op.specialist_id AND is_active) THEN RAISE EXCEPTION 'test mapping changed'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_answers) k WHERE NOT EXISTS(SELECT 1 FROM public.test_questions WHERE test_id=op.test_id AND id::text=k)) THEN RAISE EXCEPTION 'unknown answer'; END IF;
 FOR q IN SELECT * FROM public.test_questions WHERE test_id=op.test_id ORDER BY step_number LOOP
  total:=total+1; a:=p_answers->q.id::text;
  IF q.is_required AND (a IS NULL OR a='null'::jsonb OR a='""'::jsonb) THEN RAISE EXCEPTION 'required answer'; END IF;
  IF a IS NOT NULL AND a<>'null'::jsonb THEN
   answered:=answered+1;
   IF q.question_type='multiple_choice' THEN
    IF jsonb_typeof(a)<>'string' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) x WHERE x=a OR x->>'text'=a#>>'{}' OR x->>'value'=a#>>'{}') THEN RAISE EXCEPTION 'invalid option'; END IF;
   ELSIF q.question_type='scale' THEN
    IF jsonb_typeof(a)<>'number' OR (a#>>'{}')::numeric NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'invalid scale'; END IF;
   ELSIF q.question_type='text' THEN
    IF jsonb_typeof(a)<>'string' OR length(a#>>'{}')>4000 THEN RAISE EXCEPTION 'invalid text'; END IF;
   ELSE RAISE EXCEPTION 'unsupported question type'; END IF;
  END IF;
 END LOOP;
 IF total=0 THEN RAISE EXCEPTION 'empty test'; END IF;
 PERFORM set_config('app.health_test_operation',op.id::text,true);
 INSERT INTO public.test_results(test_id,specialist_id,patient_user_id,patient_name,patient_email,answers,results,status)
 VALUES(op.test_id,op.specialist_id,p_user,p_name,p_contact,p_answers,jsonb_build_object('answeredQuestions',answered,'totalQuestions',total,'completionRate',round(answered*100.0/total),'interpretation','specialist_review_required'),'completed') RETURNING id INTO rid;
 UPDATE public.health_test_operations SET result_id=rid,payload_hash=digest,updated_at=now() WHERE id=op.id;
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.health_test_commit(uuid,uuid,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.health_test_commit(uuid,uuid,text,text,text,jsonb) TO service_role;

CREATE FUNCTION public.health_test_withdraw(p_user uuid,p_operation uuid,p_capability_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE op public.health_test_operations;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR p_user IS NULL THEN RAISE EXCEPTION 'verified server required' USING ERRCODE='42501'; END IF;
 SELECT * INTO op FROM public.health_test_operations WHERE id=p_operation FOR UPDATE;
 IF NOT FOUND OR op.user_id IS DISTINCT FROM p_user OR op.capability_hash IS DISTINCT FROM p_capability_hash THEN RAISE EXCEPTION 'operation denied' USING ERRCODE='42501'; END IF;
 IF op.withdrawn_at IS NOT NULL THEN RETURN true; END IF;
 INSERT INTO public.health_test_consent_events(operation_id,user_id,purpose,action,document_version,document_hash,document_text)
 SELECT op.id,op.user_id,'health_test','withdraw',document_version,document_hash,document_text FROM public.health_test_consent_events WHERE operation_id=op.id AND purpose='health_test' AND action='grant';
 IF NOT FOUND THEN RAISE EXCEPTION 'grant evidence missing'; END IF;
 UPDATE public.health_test_operations SET withdrawn_at=now(),updated_at=now() WHERE id=op.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.health_test_withdraw(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.health_test_withdraw(uuid,uuid,text) TO service_role;

CREATE FUNCTION public.enforce_health_test_operation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE op public.health_test_operations;
BEGIN
 -- Inactive until document and old-device acceptance checks pass; legacy behavior is unchanged meanwhile.
 IF NOT EXISTS(SELECT 1 FROM public.health_test_release WHERE singleton AND enabled) THEN RETURN NEW; END IF;
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Bu test sürümü güvenli izin doğrulamasını desteklemiyor. Teste başlamadan uygulamanızı güncelleyin.' USING ERRCODE='42501'; END IF;
 SELECT * INTO op FROM public.health_test_operations WHERE id::text=current_setting('app.health_test_operation',true);
 IF NOT FOUND OR op.user_id IS DISTINCT FROM NEW.patient_user_id OR op.test_id IS DISTINCT FROM NEW.test_id OR op.specialist_id IS DISTINCT FROM NEW.specialist_id OR op.withdrawn_at IS NOT NULL OR op.result_id IS NOT NULL OR now()>=op.expires_at THEN RAISE EXCEPTION 'verified health operation required' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_health_test_operation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER enforce_health_test_operation BEFORE INSERT ON public.test_results FOR EACH ROW EXECUTE FUNCTION public.enforce_health_test_operation();