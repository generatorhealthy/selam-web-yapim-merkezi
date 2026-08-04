CREATE TABLE IF NOT EXISTS public.failed_payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  sms_sent_at timestamptz,
  sms_error text,
  call_started_at timestamptz,
  call_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.failed_payment_notifications TO authenticated;
GRANT ALL ON public.failed_payment_notifications TO service_role;

ALTER TABLE public.failed_payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can view failed payment notifications"
ON public.failed_payment_notifications
FOR SELECT
TO authenticated
USING (public.is_admin_or_staff());