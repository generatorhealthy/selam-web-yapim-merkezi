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