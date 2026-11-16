CREATE OR REPLACE FUNCTION public.auto_confirm_bank_notification(p_order_id uuid, p_amount numeric, p_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE o public.orders; s public.specialists; actor uuid; ref text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_only' USING ERRCODE='42501'; END IF;
 ref := 'AUTO-' || upper(regexp_replace(coalesce(p_reference,''),'[^A-Za-z0-9]','','g'));
 IF length(ref) < 10 THEN RAISE EXCEPTION 'reference_required' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('bankorder:'||p_order_id::text,0));
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL OR o.deleted_at IS NOT NULL OR o.status IS DISTINCT FROM 'pending'
   OR o.payment_method NOT IN ('bank_transfer','banka_havalesi') OR o.amount IS DISTINCT FROM p_amount THEN
   RETURN jsonb_build_object('status','skipped');
 END IF;
 IF EXISTS(SELECT 1 FROM public.bank_transfer_verifications WHERE order_id=o.id OR bank_reference=ref) THEN
   RETURN jsonb_build_object('status','already_confirmed');
 END IF;
 SELECT * INTO s FROM public.specialists WHERE lower(trim(email))=lower(trim(o.customer_email)) LIMIT 2;
 IF s.id IS NULL OR (SELECT count(*) FROM public.specialists WHERE lower(trim(email))=lower(trim(o.customer_email)))<>1 THEN
   RETURN jsonb_build_object('status','identity_unclear');
 END IF;
 SELECT user_id INTO actor FROM public.user_profiles WHERE role='admin' AND is_approved=true ORDER BY created_at LIMIT 1;
 IF actor IS NULL THEN RETURN jsonb_build_object('status','no_admin'); END IF;
 INSERT INTO public.bank_transfer_verifications(order_id,specialist_id,bank_reference,amount,verified_by,statement_checked)
 VALUES(o.id,s.id,ref,p_amount,actor,true);
 UPDATE public.orders SET status='approved',payment_status='paid',approved_at=now(),updated_at=now() WHERE id=o.id;
 RETURN jsonb_build_object('status','confirmed','order_id',o.id);
END $fn$;
REVOKE ALL ON FUNCTION public.auto_confirm_bank_notification(uuid,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_bank_notification(uuid,numeric,text) TO service_role;