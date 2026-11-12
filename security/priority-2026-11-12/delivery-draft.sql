-- REVIEW ONLY. Not a Supabase migration; deploy only via migration tool after approval.
-- No existing test, referral, consent or backup row changes.
BEGIN;
CREATE TABLE public.secure_notice_deliveries (
  kind text NOT NULL, resource_id uuid NOT NULL, channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending', attempt_id uuid,
  provider_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(kind,resource_id,channel)
);
GRANT ALL ON public.secure_notice_deliveries TO service_role;
ALTER TABLE public.secure_notice_deliveries ENABLE ROW LEVEL SECURITY;
-- No client SELECT/INSERT policies/grants. This table stores no message/phone/email.
CREATE FUNCTION public.claim_secure_notice(p_kind text,p_resource uuid,p_channel text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE token uuid := gen_random_uuid(); claimed uuid;
BEGIN
  IF current_setting('role',true) <> 'service_role' THEN RAISE EXCEPTION 'service role required' USING ERRCODE='42501'; END IF;
  IF p_kind NOT IN ('test','contact') OR p_channel NOT IN ('email','sms','whatsapp') THEN RAISE EXCEPTION 'invalid notice'; END IF;
  INSERT INTO public.secure_notice_deliveries(kind,resource_id,channel) VALUES(p_kind,p_resource,p_channel) ON CONFLICT DO NOTHING;
  UPDATE public.secure_notice_deliveries SET status='sending',attempt_id=token,updated_at=now()
   WHERE kind=p_kind AND resource_id=p_resource AND channel=p_channel AND status IN ('pending','retryable') RETURNING attempt_id INTO claimed;
  RETURN claimed;
END $$;
REVOKE ALL ON FUNCTION public.claim_secure_notice(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_secure_notice(text,uuid,text) TO service_role;
CREATE FUNCTION public.finish_secure_notice(p_kind text,p_resource uuid,p_channel text,p_attempt uuid,p_status text,p_provider text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE changed integer;
BEGIN
  IF current_setting('role',true) <> 'service_role' THEN RAISE EXCEPTION 'service role required' USING ERRCODE='42501'; END IF;
  IF p_status NOT IN ('sent','failed','unknown','retryable') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.secure_notice_deliveries SET status=p_status,provider_id=left(p_provider,200),updated_at=now()
   WHERE kind=p_kind AND resource_id=p_resource AND channel=p_channel AND attempt_id=p_attempt AND status='sending';
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed=1;
END $$;
REVOKE ALL ON FUNCTION public.finish_secure_notice(text,uuid,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_secure_notice(text,uuid,text,uuid,text,text) TO service_role;
COMMIT;
-- No timed automatic reset of 'sending': external acceptance with a timeout is unknown.
-- Provider reconciliation/manual inspection needed before any retry of unknown/sending.