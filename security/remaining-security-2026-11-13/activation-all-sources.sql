-- Candidate tested locally before release. No historical UPDATE or ownership backfill.
CREATE OR REPLACE FUNCTION public.require_activation_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- Registration source is not payment authority, including NULL and staff-created profiles.
  IF coalesce(NEW.is_active,false) AND (TG_OP='INSERT' OR NOT coalesce(OLD.is_active,false)) THEN
    IF NEW.user_id IS NULL OR NEW.email IS NULL OR NOT EXISTS(
      SELECT 1 FROM public.orders o
      WHERE lower(trim(o.customer_email))=lower(trim(NEW.email))
        AND o.status IN ('approved','completed') AND o.deleted_at IS NULL
        AND (o.payment_method NOT IN ('bank_transfer','banka_havalesi')
          OR EXISTS(SELECT 1 FROM public.bank_transfer_verifications v
            WHERE v.order_id=o.id AND v.specialist_id=NEW.id AND v.amount=o.amount AND v.statement_checked)
          OR EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders l WHERE l.order_id=o.id))
    ) THEN
      RAISE EXCEPTION 'paid_order_activation_required' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.require_activation_evidence() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.require_activation_evidence() TO service_role;