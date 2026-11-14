CREATE TABLE public.order_manual_approvals (order_id uuid PRIMARY KEY REFERENCES public.orders(id), specialist_id uuid NOT NULL REFERENCES public.specialists(id), approved_by uuid NOT NULL, reason text NOT NULL, active boolean NOT NULL DEFAULT true, approved_at timestamptz NOT NULL DEFAULT now(), reverted_by uuid, reverted_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.order_manual_approvals TO authenticated;
GRANT ALL ON public.order_manual_approvals TO service_role;
ALTER TABLE public.order_manual_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY manual_approval_admin_read ON public.order_manual_approvals FOR SELECT TO authenticated USING(public.is_admin_user());
CREATE TABLE public.order_manual_approval_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL REFERENCES public.orders(id),specialist_id uuid NOT NULL REFERENCES public.specialists(id),actor_id uuid NOT NULL,action text NOT NULL,reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.order_manual_approval_events TO authenticated;
GRANT SELECT,INSERT ON public.order_manual_approval_events TO service_role;
ALTER TABLE public.order_manual_approval_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY manual_approval_events_admin_read ON public.order_manual_approval_events FOR SELECT TO authenticated USING(public.is_admin_user());
CREATE OR REPLACE FUNCTION public.set_manual_order_approval(p_order_id uuid,p_action text,p_reason text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; s public.specialists; a public.order_manual_approvals; actor uuid := auth.uid();
BEGIN
 IF actor IS NULL OR NOT public.is_admin_user() THEN RAISE EXCEPTION 'manual_admin_required' USING ERRCODE='42501'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('approve','pending') OR p_reason IS NULL OR length(trim(p_reason))<5 OR length(p_reason)>1000 THEN RAISE EXCEPTION 'manual_reason_required' USING ERRCODE='22023'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF o.id IS NULL OR o.deleted_at IS NOT NULL OR o.status IS DISTINCT FROM 'pending' OR o.payment_method NOT IN ('bank_transfer','banka_havalesi') OR o.payment_method IS NULL OR coalesce(o.payment_status,'pending') NOT IN ('pending','failed') OR o.invoice_sent IS TRUE OR o.invoice_number IS NOT NULL OR o.payment_transaction_id IS NOT NULL OR o.subscription_reference_code IS NOT NULL OR EXISTS(SELECT 1 FROM public.bank_transfer_verifications WHERE order_id=o.id) OR EXISTS(SELECT 1 FROM public.payment_receipts WHERE order_id=o.id) THEN RAISE EXCEPTION 'manual_unpaid_pending_order_required' USING ERRCODE='23514'; END IF;
 IF (SELECT count(*) FROM public.specialists WHERE lower(trim(email))=lower(trim(o.customer_email)))<>1 THEN RAISE EXCEPTION 'manual_specialist_identity_required' USING ERRCODE='23514'; END IF;
 SELECT * INTO s FROM public.specialists WHERE lower(trim(email))=lower(trim(o.customer_email)) FOR UPDATE;
 IF s.id IS NULL OR s.user_id IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=s.user_id AND lower(trim(email))=lower(trim(o.customer_email))) THEN RAISE EXCEPTION 'manual_specialist_identity_required' USING ERRCODE='23514'; END IF;
 SELECT * INTO a FROM public.order_manual_approvals WHERE order_id=o.id FOR UPDATE;
 IF a.order_id IS NOT NULL AND a.specialist_id IS DISTINCT FROM s.id THEN RAISE EXCEPTION 'manual_specialist_identity_changed' USING ERRCODE='23514'; END IF;
 IF p_action='approve' THEN
 IF coalesce(a.active,false) THEN RETURN jsonb_build_object('duplicate',true,'active',true,'order_id',o.id); END IF;
 INSERT INTO public.order_manual_approvals(order_id,specialist_id,approved_by,reason) VALUES(o.id,s.id,actor,trim(p_reason)) ON CONFLICT(order_id) DO UPDATE SET active=true,approved_by=actor,reason=trim(p_reason),approved_at=now(),reverted_by=null,reverted_at=null,updated_at=now();
 UPDATE public.specialists SET is_active=true WHERE id=s.id AND NOT coalesce(is_active,false);
 ELSE
 IF a.order_id IS NULL THEN RAISE EXCEPTION 'manual_approval_not_found' USING ERRCODE='23514'; END IF;
 IF NOT a.active THEN RETURN jsonb_build_object('duplicate',true,'active',false,'order_id',o.id); END IF;
 UPDATE public.order_manual_approvals SET active=false,reverted_by=actor,reverted_at=now(),updated_at=now() WHERE order_id=o.id;
 END IF;
 INSERT INTO public.order_manual_approval_events(order_id,specialist_id,actor_id,action,reason) VALUES(o.id,s.id,actor,p_action,trim(p_reason));
 RETURN jsonb_build_object('duplicate',false,'active',p_action='approve','order_id',o.id);
END $$;
REVOKE ALL ON FUNCTION public.set_manual_order_approval(uuid,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.set_manual_order_approval(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.require_activation_evidence() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF coalesce(NEW.is_active,false) AND (TG_OP='INSERT' OR NOT coalesce(OLD.is_active,false)) THEN
 IF NEW.user_id IS NULL OR NEW.email IS NULL OR NOT (
 EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(NEW.email)) AND o.status IN ('approved','completed') AND o.deleted_at IS NULL AND (o.payment_method NOT IN ('bank_transfer','banka_havalesi') OR EXISTS(SELECT 1 FROM public.bank_transfer_verifications v WHERE v.order_id=o.id AND v.specialist_id=NEW.id AND v.amount=o.amount AND v.statement_checked) OR EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders l WHERE l.order_id=o.id)))
 OR EXISTS(SELECT 1 FROM public.order_manual_approvals a JOIN public.orders o ON o.id=a.order_id WHERE a.specialist_id=NEW.id AND a.active AND o.deleted_at IS NULL AND o.status='pending' AND lower(trim(o.customer_email))=lower(trim(NEW.email)) AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))))
 ) THEN RAISE EXCEPTION 'paid_order_activation_required' USING ERRCODE='42501'; END IF;
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.require_activation_evidence() FROM PUBLIC,anon,authenticated;