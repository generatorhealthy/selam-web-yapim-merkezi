
-- 1. Add Iyzico subscription tracking columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subscription_reference_code TEXT,
  ADD COLUMN IF NOT EXISTS iyzico_customer_reference_code TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_subscription_ref ON public.orders(subscription_reference_code) WHERE subscription_reference_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_iyzico_customer_ref ON public.orders(iyzico_customer_reference_code) WHERE iyzico_customer_reference_code IS NOT NULL;

-- 2. Add same to automatic_orders for quick lookup
ALTER TABLE public.automatic_orders
  ADD COLUMN IF NOT EXISTS subscription_reference_code TEXT,
  ADD COLUMN IF NOT EXISTS iyzico_customer_reference_code TEXT,
  ADD COLUMN IF NOT EXISTS last_card_update_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auto_orders_subscription_ref ON public.automatic_orders(subscription_reference_code) WHERE subscription_reference_code IS NOT NULL;

-- 3. Payment method change history table
CREATE TABLE IF NOT EXISTS public.payment_method_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_email TEXT NOT NULL,
  specialist_name TEXT,
  old_payment_method TEXT,
  new_payment_method TEXT NOT NULL,
  old_subscription_ref TEXT,
  new_subscription_ref TEXT,
  iyzico_token TEXT,
  iyzico_checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  notes TEXT,
  initiated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pmc_email ON public.payment_method_changes(specialist_email);
CREATE INDEX IF NOT EXISTS idx_pmc_token ON public.payment_method_changes(iyzico_token) WHERE iyzico_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pmc_status ON public.payment_method_changes(status);

ALTER TABLE public.payment_method_changes ENABLE ROW LEVEL SECURITY;

-- Specialists can view their own change history
CREATE POLICY "Specialists view own payment changes"
  ON public.payment_method_changes
  FOR SELECT
  TO authenticated
  USING (
    specialist_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_admin_or_staff_user()
  );

-- Only admins/staff can insert manually; edge functions use service role
CREATE POLICY "Admins insert payment changes"
  ON public.payment_method_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_staff_user());

-- Only admins/staff can update manually; edge functions use service role
CREATE POLICY "Admins update payment changes"
  ON public.payment_method_changes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_staff_user());

-- Auto-update timestamp trigger
CREATE TRIGGER trg_payment_method_changes_updated_at
  BEFORE UPDATE ON public.payment_method_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_timestamp_update();
