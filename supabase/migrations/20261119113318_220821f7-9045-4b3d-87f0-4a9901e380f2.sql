CREATE OR REPLACE FUNCTION public.require_activation_evidence()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 IF auth.uid() IS NOT NULL AND public.is_admin_user() THEN RETURN NEW; END IF;
 IF coalesce(NEW.is_active,false) AND (TG_OP='INSERT' OR NOT coalesce(OLD.is_active,false)) THEN
 IF NEW.user_id IS NULL OR NEW.email IS NULL OR NOT (
 EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(NEW.email)) AND o.status IN ('approved','completed') AND o.deleted_at IS NULL AND (o.payment_method NOT IN ('bank_transfer','banka_havalesi') OR EXISTS(SELECT 1 FROM public.bank_transfer_verifications v WHERE v.order_id=o.id AND v.specialist_id=NEW.id AND v.amount=o.amount AND v.statement_checked) OR EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders l WHERE l.order_id=o.id)))
 OR EXISTS(SELECT 1 FROM public.order_manual_approvals a JOIN public.orders o ON o.id=a.order_id WHERE a.specialist_id=NEW.id AND a.active AND o.deleted_at IS NULL AND o.status='pending' AND lower(trim(o.customer_email))=lower(trim(NEW.email)) AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))))
 OR EXISTS(SELECT 1 FROM public.specialist_publication_permissions p WHERE p.specialist_id=NEW.id AND p.active AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))))
 ) THEN RAISE EXCEPTION 'paid_order_activation_required' USING ERRCODE='42501'; END IF;
 END IF; RETURN NEW;
END $function$;