
CREATE TABLE public.cancellation_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_tc_no TEXT,
  subscription_reference_code TEXT,
  amount NUMERIC DEFAULT 0,
  charge_status TEXT DEFAULT 'pending' CHECK (charge_status IN ('pending', 'charged', 'failed', 'cancelled')),
  charge_result TEXT,
  charged_at TIMESTAMPTZ,
  charged_by UUID,
  notes TEXT,
  deleted_from_user_id UUID,
  specialist_id UUID,
  legal_evidence_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage cancellation_fees" ON public.cancellation_fees
  FOR ALL USING (public.is_admin_user());

CREATE TRIGGER update_cancellation_fees_updated_at
  BEFORE UPDATE ON public.cancellation_fees
  FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();
