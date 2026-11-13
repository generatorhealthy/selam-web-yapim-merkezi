CREATE TABLE public.bank_transfer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  specialist_id uuid NOT NULL REFERENCES public.specialists(id),
  bank_reference text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  verified_by uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  statement_checked boolean NOT NULL
);
GRANT SELECT ON public.bank_transfer_verifications TO authenticated;
GRANT SELECT ON public.bank_transfer_verifications TO service_role;
ALTER TABLE public.bank_transfer_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_verification_admin_read ON public.bank_transfer_verifications
FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE TABLE public.bank_legacy_paid_orders (order_id uuid PRIMARY KEY REFERENCES public.orders(id));
GRANT SELECT ON public.bank_legacy_paid_orders TO service_role;
ALTER TABLE public.bank_legacy_paid_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_legacy_service_read ON public.bank_legacy_paid_orders FOR SELECT TO service_role USING (true);
INSERT INTO public.bank_legacy_paid_orders(order_id)
SELECT id FROM public.orders WHERE status IN ('approved','completed') AND payment_method IN ('bank_transfer','banka_havalesi');
CREATE OR REPLACE FUNCTION public.confirm_bank_transfer(
  p_order_id uuid,p_specialist_id uuid,p_bank_reference text,p_amount numeric,p_statement_checked boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; s public.specialists; existing public.bank_transfer_verifications; ref text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'bank_admin_required' USING ERRCODE='42501';
  END IF;
  ref := upper(regexp_replace(trim(p_bank_reference),'[[:space:]]','','g'));
  IF p_statement_checked IS DISTINCT FROM true OR ref IS NULL OR length(ref)<8 OR length(ref)>120
    OR ref !~ '^[A-Z0-9/_-]+$' OR p_amount IS NULL OR p_amount<=0 THEN
    RAISE EXCEPTION 'bank_statement_confirmation_required' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('bank:'||ref,0));
  SELECT * INTO o FROM public.orders WHERE id=p_order_id FOR UPDATE;
  SELECT * INTO s FROM public.specialists WHERE id=p_specialist_id FOR UPDATE;
  IF o.id IS NULL OR s.id IS NULL OR s.user_id IS NULL OR o.deleted_at IS NOT NULL
    OR lower(trim(s.email)) IS DISTINCT FROM lower(trim(o.customer_email))
    OR (SELECT count(*) FROM public.specialists WHERE lower(trim(email))=lower(trim(o.customer_email)))<>1
    OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id=s.user_id AND lower(trim(email))=lower(trim(o.customer_email))) THEN
    RAISE EXCEPTION 'bank_order_identity_mismatch' USING ERRCODE='23514';
  END IF;
  SELECT * INTO existing FROM public.bank_transfer_verifications WHERE bank_reference=ref OR order_id=o.id LIMIT 1;
  IF existing.id IS NOT NULL THEN
    IF existing.order_id=o.id AND existing.specialist_id=s.id AND existing.bank_reference=ref AND existing.amount=p_amount THEN
      RETURN jsonb_build_object('status','already_confirmed','order_id',o.id);
    END IF;
    RAISE EXCEPTION 'bank_reference_already_used' USING ERRCODE='23505';
  END IF;
  IF o.status IS DISTINCT FROM 'pending' OR o.payment_method IS NULL OR o.payment_method NOT IN ('bank_transfer','banka_havalesi')
    OR o.amount IS DISTINCT FROM p_amount THEN
    RAISE EXCEPTION 'bank_order_amount_or_status_mismatch' USING ERRCODE='23514';
  END IF;
  INSERT INTO public.bank_transfer_verifications(order_id,specialist_id,bank_reference,amount,verified_by,statement_checked)
    VALUES(o.id,s.id,ref,p_amount,auth.uid(),true);
  UPDATE public.orders SET status='approved',payment_status='paid',approved_by=auth.uid(),approved_at=now(),updated_at=now()
    WHERE id=o.id;
  RETURN jsonb_build_object('status','confirmed','order_id',o.id);
END $$;
REVOKE ALL ON FUNCTION public.confirm_bank_transfer(uuid,uuid,text,numeric,boolean) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.confirm_bank_transfer(uuid,uuid,text,numeric,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.require_bank_verification() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.package_type IN ('ozel-firsat','kayit-linki')
    AND coalesce(OLD.is_first_order,true) AND coalesce(OLD.subscription_month,1)=1
    AND NOT EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders WHERE order_id=OLD.id)
    AND (NEW.amount IS DISTINCT FROM OLD.amount OR NEW.package_type IS DISTINCT FROM OLD.package_type
      OR NEW.is_first_order IS DISTINCT FROM OLD.is_first_order OR NEW.subscription_month IS DISTINCT FROM OLD.subscription_month) THEN
    RAISE EXCEPTION 'new_sale_terms_immutable' USING ERRCODE='42501';
  END IF;
  IF TG_OP='UPDATE' AND OLD.payment_method IN ('bank_transfer','banka_havalesi')
    AND (NEW.payment_method IS DISTINCT FROM OLD.payment_method OR NEW.customer_email IS DISTINCT FROM OLD.customer_email)
    AND NOT EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders WHERE order_id=OLD.id) THEN
    RAISE EXCEPTION 'bank_order_identity_immutable' USING ERRCODE='42501';
  END IF;
  IF NEW.payment_method IN ('bank_transfer','banka_havalesi')
    AND (NEW.status IN ('approved','completed') OR NEW.payment_status='paid')
    AND NOT EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders WHERE order_id=NEW.id) THEN
    IF NOT EXISTS (SELECT 1 FROM public.bank_transfer_verifications v JOIN public.specialists s ON s.id=v.specialist_id
      WHERE v.order_id=NEW.id AND v.amount=NEW.amount AND v.statement_checked
        AND lower(trim(s.email))=lower(trim(NEW.customer_email))) THEN
      RAISE EXCEPTION 'verified_bank_transfer_required' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.require_bank_verification() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a_bank_verification BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.require_bank_verification();
CREATE OR REPLACE FUNCTION public.require_activation_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF coalesce(NEW.is_active,false) AND (TG_OP='INSERT' OR NOT coalesce(OLD.is_active,false))
    AND (NEW.registration_source='self_registration' OR (TG_OP='UPDATE' AND OLD.registration_source='self_registration')) THEN
    IF NOT EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(NEW.email))
      AND o.status IN ('approved','completed') AND o.deleted_at IS NULL
      AND (o.payment_method NOT IN ('bank_transfer','banka_havalesi')
        OR EXISTS(SELECT 1 FROM public.bank_transfer_verifications v WHERE v.order_id=o.id AND v.specialist_id=NEW.id)
        OR EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders l WHERE l.order_id=o.id))) THEN
      RAISE EXCEPTION 'paid_order_activation_required' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.require_activation_evidence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a_activation_evidence BEFORE INSERT OR UPDATE ON public.specialists
FOR EACH ROW EXECUTE FUNCTION public.require_activation_evidence();