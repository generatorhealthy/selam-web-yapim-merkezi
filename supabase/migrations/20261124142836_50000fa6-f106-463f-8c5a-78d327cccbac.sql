CREATE OR REPLACE FUNCTION public.guard_confirmed_offer_price()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE expected numeric; trusted boolean;
BEGIN
  trusted := coalesce(auth.role()='service_role',false)
    OR (session_user='postgres' AND current_setting('role',true) IN ('none','postgres'))
    OR (auth.uid() IS NOT NULL AND public.is_admin_or_staff_user());
  IF trusted AND NEW.is_first_order IS FALSE AND NEW.subscription_month > 1
    AND EXISTS (SELECT 1 FROM public.orders prior
      WHERE prior.status IN ('approved','completed') AND prior.deleted_at IS NULL
        AND lower(trim(prior.customer_email))=lower(trim(NEW.customer_email))
        AND coalesce(prior.subscription_month,1)<NEW.subscription_month
        AND (NEW.parent_order_id IS NULL OR NEW.parent_order_id=prior.id
          OR NEW.parent_order_id=prior.parent_order_id)) THEN
    RETURN NEW;
  END IF;
  IF NEW.is_first_order IS FALSE OR coalesce(NEW.subscription_month,1)<>1
    OR NEW.parent_order_id IS NOT NULL THEN
    RAISE EXCEPTION 'renewal_server_evidence_required' USING ERRCODE='23514';
  END IF;
  expected := CASE NEW.package_type WHEN 'ozel-firsat' THEN 4000 WHEN 'kayit-linki' THEN 5000
    WHEN 'aktif-odeme' THEN 4000 WHEN 'abonelik-devami' THEN 3600 WHEN 'odeme-linki' THEN 3000 ELSE NULL END;
  IF expected IS NULL THEN
    RAISE EXCEPTION 'new_sale_package_not_allowed' USING ERRCODE='23514';
  END IF;
  IF NEW.amount IS NOT NULL AND NEW.amount IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'offer_price_mismatch' USING ERRCODE='23514';
  END IF;
  IF NEW.payment_method IS NULL OR NEW.payment_method NOT IN ('bank_transfer','credit_card') THEN
    RAISE EXCEPTION 'new_sale_payment_method_not_allowed' USING ERRCODE='23514';
  END IF;
  NEW.amount := expected;
  NEW.package_name := CASE WHEN NEW.package_type IN ('aktif-odeme','abonelik-devami','odeme-linki')
    THEN 'Premium Paket - Abonelik Devamı' ELSE 'Premium Paket - Özel Fırsat' END;
  NEW.is_first_order := true;
  NEW.subscription_month := 1;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.require_bank_verification()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP='UPDATE' AND coalesce(auth.role()='service_role',false)
    AND public.invoice_queue_update_only(to_jsonb(OLD),to_jsonb(NEW)) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND public.is_admin_user() THEN
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' AND OLD.package_type IN ('ozel-firsat','kayit-linki','aktif-odeme','abonelik-devami','odeme-linki')
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
END $function$;