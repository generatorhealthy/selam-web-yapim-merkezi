-- DRAFT ONLY. Separate approval and real mobile migration required. No historic INSERT/UPDATE/DELETE.
BEGIN;
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
COMMIT;