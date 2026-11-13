-- INSERT only: existing orders, approvals and signed snapshots are untouched.
CREATE OR REPLACE FUNCTION public.guard_confirmed_offer_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE expected numeric; trusted boolean;
BEGIN
  trusted := coalesce(auth.role()='service_role',false)
    OR (session_user='postgres' AND current_setting('role',true) IN ('none','postgres'))
    OR (auth.uid() IS NOT NULL AND public.is_admin_or_staff_user());
  -- Client-controlled renewal flags alone never authorize a historical price.
  -- Existing daily/server and staff renewal writers use this same stored prior-order evidence.
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
  expected := CASE NEW.package_type WHEN 'ozel-firsat' THEN 4000 WHEN 'kayit-linki' THEN 5000 ELSE NULL END;
  IF expected IS NULL THEN
    RAISE EXCEPTION 'new_sale_package_not_allowed' USING ERRCODE='23514';
  END IF;
  IF NEW.amount IS NOT NULL AND NEW.amount IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'offer_price_mismatch' USING ERRCODE='23514';
  END IF;
  IF NEW.payment_method IS DISTINCT FROM 'bank_transfer' THEN
    RAISE EXCEPTION 'new_sale_bank_transfer_only' USING ERRCODE='23514';
  END IF;
  NEW.amount := expected;
  NEW.package_name := 'Premium Paket - Özel Fırsat';
  NEW.is_first_order := true;
  NEW.subscription_month := 1;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_confirmed_offer_price() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_confirmed_offer_price() TO service_role;