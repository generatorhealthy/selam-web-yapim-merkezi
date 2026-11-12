-- Candidate only: NOT a deployed migration. Activation requires routing every
-- payment writer through this transaction and accepting existing provider flows.
CREATE TABLE public.payment_settlement_receipts (
  charge_ref text PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  subscription_ref text NOT NULL,
  customer_ref text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_settlement_receipts TO service_role;
ALTER TABLE public.payment_settlement_receipts ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.payment_settlement_outbox (
  order_id uuid NOT NULL REFERENCES public.orders(id),
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(order_id,purpose)
);
GRANT ALL ON public.payment_settlement_outbox TO service_role;
ALTER TABLE public.payment_settlement_outbox ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.commit_verified_payment(
 p_order_id uuid,p_charge_ref text,p_subscription_ref text,p_customer_ref text,
 p_email text,p_amount numeric,p_currency text,p_paid_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target public.orders%ROWTYPE; previous public.payment_settlement_receipts%ROWTYPE;
BEGIN
 IF NOT (COALESCE(auth.role()='service_role',false)
   OR (session_user='postgres' AND current_setting('role',true) IN ('none','postgres'))) THEN
   RAISE EXCEPTION 'service_payment_proof_required' USING ERRCODE='42501';
 END IF;
 IF p_charge_ref IS NULL OR length(p_charge_ref)=0 OR p_subscription_ref IS NULL
   OR p_customer_ref IS NULL OR p_paid_at IS NULL OR p_amount<=0 OR p_currency<>'TRY' THEN
   RAISE EXCEPTION 'incomplete_payment_proof';
 END IF;
 -- Serialize all callers for the same charge, including different target orders.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_charge_ref,719));
 SELECT * INTO previous FROM public.payment_settlement_receipts WHERE charge_ref=p_charge_ref;
 IF FOUND THEN
   IF previous.order_id<>p_order_id OR previous.subscription_ref<>p_subscription_ref
      OR previous.customer_ref<>p_customer_ref OR previous.amount<>p_amount OR previous.currency<>p_currency THEN
     RAISE EXCEPTION 'payment_receipt_conflict';
   END IF;
   RETURN jsonb_build_object('action','duplicate','orderId',previous.order_id);
 END IF;
 SELECT * INTO target FROM public.orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR target.status<>'pending' OR lower(trim(target.customer_email))<>lower(trim(p_email))
    OR target.amount<>p_amount
    OR (target.subscription_reference_code IS NOT NULL AND target.subscription_reference_code<>p_subscription_ref)
    OR (target.iyzico_customer_reference_code IS NOT NULL AND target.iyzico_customer_reference_code<>p_customer_ref) THEN
   RAISE EXCEPTION 'payment_order_mismatch';
 END IF;
 INSERT INTO public.payment_settlement_receipts(charge_ref,order_id,subscription_ref,customer_ref,amount,currency,paid_at)
 VALUES(p_charge_ref,p_order_id,p_subscription_ref,p_customer_ref,p_amount,p_currency,p_paid_at);
 INSERT INTO public.payment_settlement_outbox(order_id,purpose)
 VALUES(p_order_id,'invoice'),(p_order_id,'notification') ON CONFLICT DO NOTHING;
 UPDATE public.orders SET status='approved',payment_status='success',approved_at=now(),
   payment_method='credit_card',payment_transaction_id=p_charge_ref,
   subscription_reference_code=p_subscription_ref,iyzico_customer_reference_code=p_customer_ref
 WHERE id=p_order_id;
 RETURN jsonb_build_object('action','applied','orderId',p_order_id);
END $$;
REVOKE ALL ON FUNCTION public.commit_verified_payment(uuid,text,text,text,text,numeric,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_verified_payment(uuid,text,text,text,text,numeric,text,timestamptz) TO service_role;