CREATE OR REPLACE FUNCTION public.require_bank_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  -- Onaylı yönetici (admin rolü) sipariş üzerinde tam yetkilidir.
  IF auth.uid() IS NOT NULL AND public.is_admin_user() THEN
    RETURN NEW;
  END IF;
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
END $fn$;