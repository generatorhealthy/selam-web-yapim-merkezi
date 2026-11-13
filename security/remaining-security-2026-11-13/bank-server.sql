CREATE OR REPLACE FUNCTION public.confirm_bank_transfer_server(p_actor_id uuid,p_order_id uuid,p_specialist_id uuid,p_bank_reference text,p_amount numeric,p_statement_checked boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; s public.specialists; existing public.bank_transfer_verifications; ref text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=p_actor_id AND role='admin' AND is_approved=true) THEN RAISE EXCEPTION 'bank_admin_required' USING ERRCODE='42501'; END IF;
 ref:=upper(regexp_replace(trim(p_bank_reference),'[[:space:]]','','g'));
 IF p_statement_checked IS DISTINCT FROM true OR ref IS NULL OR length(ref)<8 OR length(ref)>120 OR ref !~ '^[A-Z0-9/_-]+$' OR p_amount IS NULL OR p_amount<=0 THEN RAISE EXCEPTION 'bank_statement_confirmation_required' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('bank:'||ref,0));
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 SELECT * INTO s FROM public.specialists WHERE id=p_specialist_id FOR UPDATE;
 IF o.id IS NULL OR s.id IS NULL OR s.user_id IS NULL OR o.deleted_at IS NOT NULL OR lower(trim(s.email)) IS DISTINCT FROM lower(trim(o.customer_email)) OR (SELECT count(*) FROM public.specialists WHERE lower(trim(email))=lower(trim(o.customer_email)))<>1 OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=s.user_id AND lower(trim(email))=lower(trim(o.customer_email))) THEN RAISE EXCEPTION 'bank_order_identity_mismatch' USING ERRCODE='23514'; END IF;
 SELECT * INTO existing FROM public.bank_transfer_verifications WHERE bank_reference=ref OR order_id=o.id LIMIT 1;
 IF existing.id IS NOT NULL THEN
  IF existing.order_id=o.id AND existing.specialist_id=s.id AND existing.bank_reference=ref AND existing.amount=p_amount THEN RETURN jsonb_build_object('status','already_confirmed','order_id',o.id); END IF;
  RAISE EXCEPTION 'bank_reference_already_used' USING ERRCODE='23505';
 END IF;
 IF o.status IS DISTINCT FROM 'pending' OR o.payment_method IS NULL OR o.payment_method NOT IN ('bank_transfer','banka_havalesi') OR o.amount IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'bank_order_amount_or_status_mismatch' USING ERRCODE='23514'; END IF;
 INSERT INTO public.bank_transfer_verifications(order_id,specialist_id,bank_reference,amount,verified_by,statement_checked) VALUES(o.id,s.id,ref,p_amount,p_actor_id,true);
 UPDATE public.orders SET status='approved',payment_status='paid',approved_by=p_actor_id,approved_at=now(),updated_at=now() WHERE id=o.id;
 RETURN jsonb_build_object('status','confirmed','order_id',o.id);
END $$;
REVOKE ALL ON FUNCTION public.confirm_bank_transfer_server(uuid,uuid,uuid,text,numeric,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_bank_transfer_server(uuid,uuid,uuid,text,numeric,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.confirm_bank_transfer(uuid,uuid,text,numeric,boolean) FROM PUBLIC,anon,authenticated,service_role;