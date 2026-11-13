CREATE TABLE public.payment_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  conversation_id text NOT NULL UNIQUE,
  iyzico_token text UNIQUE,
  plan_ref text NOT NULL,
  expected_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  status text NOT NULL DEFAULT 'initializing',
  subscription_reference_code text UNIQUE,
  customer_reference_code text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  initialized_at timestamptz,
  settled_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_checkout_sessions TO service_role;
ALTER TABLE public.payment_checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages checkout sessions" ON public.payment_checkout_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX payment_checkout_sessions_open_idx ON public.payment_checkout_sessions(status, created_at) WHERE status = 'initialized';

CREATE TABLE public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'iyzico',
  payment_key text NOT NULL UNIQUE,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  session_id uuid REFERENCES public.payment_checkout_sessions(id),
  subscription_reference_code text NOT NULL,
  customer_reference_code text NOT NULL,
  charge_reference text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  paid_at timestamptz NOT NULL,
  source text NOT NULL,
  binding text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_receipts TO service_role;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages payment receipts" ON public.payment_receipts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.settle_iyzico_payment(
  p_order_id uuid, p_payment_key text, p_subscription_ref text, p_customer_ref text,
  p_charge_ref text, p_amount numeric, p_currency text, p_paid_at timestamptz,
  p_source text, p_binding text, p_session_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE; s public.payment_checkout_sessions%ROWTYPE; prior uuid;
BEGIN
  IF p_order_id IS NULL OR coalesce(p_payment_key,'') = '' OR coalesce(p_subscription_ref,'') = ''
     OR coalesce(p_customer_ref,'') = '' OR coalesce(p_charge_ref,'') = '' OR p_paid_at IS NULL
     OR p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('outcome','rejected','reason','proof_incomplete');
  END IF;
  IF p_currency IS DISTINCT FROM 'TRY' THEN
    RETURN jsonb_build_object('outcome','rejected','reason','currency_mismatch');
  END IF;
  IF p_binding NOT IN ('checkout_session','subscription_ref','renewal_bound','legacy_renewal') THEN
    RETURN jsonb_build_object('outcome','rejected','reason','binding_not_allowed');
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('outcome','rejected','reason','order_missing'); END IF;

  SELECT order_id INTO prior FROM public.payment_receipts WHERE payment_key = p_payment_key;
  IF FOUND THEN RETURN jsonb_build_object('outcome','duplicate','order_id',prior); END IF;
  IF EXISTS (SELECT 1 FROM public.payment_receipts WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('outcome','duplicate','order_id',p_order_id);
  END IF;

  IF o.deleted_at IS NOT NULL OR o.status <> 'pending' THEN
    RETURN jsonb_build_object('outcome','rejected','reason','order_not_pending','order_id',o.id);
  END IF;
  IF abs(o.amount - p_amount) > 0.005 THEN
    RETURN jsonb_build_object('outcome','rejected','reason','amount_mismatch');
  END IF;
  IF o.subscription_reference_code IS NOT NULL AND o.subscription_reference_code <> p_subscription_ref THEN
    RETURN jsonb_build_object('outcome','rejected','reason','subscription_mismatch');
  END IF;

  IF p_session_id IS NOT NULL THEN
    SELECT * INTO s FROM public.payment_checkout_sessions WHERE id = p_session_id FOR UPDATE;
    IF NOT FOUND OR s.order_id <> p_order_id OR s.status NOT IN ('initialized')
       OR abs(s.expected_amount - p_amount) > 0.005 OR s.currency <> p_currency
       OR (s.subscription_reference_code IS NOT NULL AND s.subscription_reference_code <> p_subscription_ref) THEN
      RETURN jsonb_build_object('outcome','rejected','reason','session_mismatch');
    END IF;
  ELSIF p_binding = 'checkout_session' THEN
    RETURN jsonb_build_object('outcome','rejected','reason','session_required');
  ELSIF coalesce(o.is_first_order, true) THEN
    -- First purchases may only be settled through a server checkout session.
    RETURN jsonb_build_object('outcome','rejected','reason','first_order_requires_session');
  END IF;

  -- A charge made before this deployment may already have approved another order without a receipt.
  IF EXISTS (SELECT 1 FROM public.orders x WHERE x.id <> p_order_id AND x.status IN ('approved','completed')
       AND x.deleted_at IS NULL AND x.approved_at >= p_paid_at
       AND (x.subscription_reference_code = p_subscription_ref
            OR (p_binding = 'legacy_renewal' AND lower(x.customer_email) = lower(o.customer_email)))) THEN
    RETURN jsonb_build_object('outcome','duplicate','reason','charge_already_consumed');
  END IF;

  BEGIN
    INSERT INTO public.payment_receipts(payment_key, order_id, session_id, subscription_reference_code,
      customer_reference_code, charge_reference, amount, currency, paid_at, source, binding)
    VALUES (p_payment_key, p_order_id, p_session_id, p_subscription_ref, p_customer_ref, p_charge_ref,
      p_amount, p_currency, p_paid_at, p_source, p_binding);
    IF p_session_id IS NOT NULL THEN
      UPDATE public.payment_checkout_sessions SET status = 'settled', settled_at = now(), updated_at = now(),
        subscription_reference_code = p_subscription_ref, customer_reference_code = p_customer_ref
      WHERE id = p_session_id;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('outcome','duplicate','reason','unique_receipt');
  END;

  UPDATE public.orders SET status = 'approved', approved_at = now(), payment_method = 'credit_card',
    payment_status = 'success', payment_transaction_id = p_subscription_ref,
    subscription_reference_code = p_subscription_ref, iyzico_customer_reference_code = p_customer_ref,
    updated_at = now()
  WHERE id = p_order_id AND status = 'pending';

  UPDATE public.automatic_orders SET subscription_reference_code = p_subscription_ref,
    iyzico_customer_reference_code = p_customer_ref
  WHERE lower(customer_email) = lower(o.customer_email) AND subscription_reference_code IS NULL;

  RETURN jsonb_build_object('outcome','applied','order_id',p_order_id);
END $$;
REVOKE ALL ON FUNCTION public.settle_iyzico_payment(uuid,text,text,text,text,numeric,text,timestamptz,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_iyzico_payment(uuid,text,text,text,text,numeric,text,timestamptz,text,text,uuid) TO service_role;