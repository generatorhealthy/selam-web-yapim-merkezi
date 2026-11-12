-- Isolated integration candidate: receipt capability has no identity until verified finalize.
CREATE TABLE public.pending_consent_receipts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email_hash text NOT NULL,capability_hash text NOT NULL,
 choices jsonb NOT NULL,versions jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',consumed_by uuid,consumed_at timestamptz
);
GRANT ALL ON public.pending_consent_receipts TO service_role;
ALTER TABLE public.pending_consent_receipts ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.prepare_pending_consents(p_email_hash text,p_capability_hash text,p_choices jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE choice record; versions jsonb:='{}';version text; doc_count integer; receipt uuid;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server only' USING ERRCODE='42501';END IF;
 IF p_email_hash !~ '^[a-f0-9]{64}$' OR p_capability_hash !~ '^[a-f0-9]{64}$' OR p_choices IS NULL OR jsonb_typeof(p_choices)<>'object' OR p_choices='{}'::jsonb THEN RAISE EXCEPTION 'invalid receipt';END IF;
 FOR choice IN SELECT * FROM jsonb_each(p_choices) ORDER BY key LOOP
  IF choice.key NOT IN ('health_test','health_appointment','sms_marketing','email_marketing','phone_marketing','analytics','ads') OR jsonb_typeof(choice.value)<>'boolean' THEN RAISE EXCEPTION 'invalid choice';END IF;
  SELECT count(*),min(d.version) INTO doc_count,version FROM public.verified_consent_documents d WHERE purpose=choice.key AND published;
  IF doc_count<>1 THEN RAISE EXCEPTION 'document unavailable';END IF;
  versions:=versions||jsonb_build_object(choice.key,version);
 END LOOP;
 INSERT INTO public.pending_consent_receipts(email_hash,capability_hash,choices,versions) VALUES(p_email_hash,p_capability_hash,p_choices,versions) RETURNING id INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.prepare_pending_consents(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_pending_consents(text,text,jsonb) TO service_role;
CREATE FUNCTION public.finalize_pending_consents(p_receipt uuid,p_hash text,p_user uuid,p_email_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE r public.pending_consent_receipts; choice record; act text;version text;op uuid;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server only' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.pending_consent_receipts WHERE id=p_receipt FOR UPDATE;
 IF NOT FOUND OR r.capability_hash IS DISTINCT FROM p_hash OR r.email_hash IS DISTINCT FROM p_email_hash OR p_user IS NULL THEN RAISE EXCEPTION 'receipt denied';END IF;
 IF r.consumed_at IS NOT NULL THEN RETURN r.consumed_by=p_user;END IF;
 IF now()>=r.expires_at THEN RAISE EXCEPTION 'receipt expired';END IF;
 FOR choice IN SELECT * FROM jsonb_each(r.choices) ORDER BY key LOOP
  IF jsonb_typeof(choice.value)<>'boolean' THEN RAISE EXCEPTION 'invalid choice';END IF;
  act:=CASE WHEN choice.value='true'::jsonb THEN 'grant' ELSE 'decline' END;
  version:=r.versions->>choice.key;
  -- Deterministic event operation ID per receipt+purpose+action; record_verified_consent prevents replay.
  op:=md5(r.id::text||':'||choice.key||':'||act)::uuid;
  PERFORM public.record_verified_consent(p_user,op,choice.key,act,version);
 END LOOP;
 UPDATE public.pending_consent_receipts SET consumed_by=p_user,consumed_at=now() WHERE id=r.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.finalize_pending_consents(uuid,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_pending_consents(uuid,text,uuid,text) TO service_role;