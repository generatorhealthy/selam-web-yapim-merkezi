CREATE TABLE public.scheduled_sms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  message text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  customer_name text,
  order_id uuid,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_sms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled_sms" ON public.scheduled_sms
  FOR ALL USING (public.is_admin_or_staff_user());

CREATE INDEX idx_scheduled_sms_pending ON public.scheduled_sms (scheduled_at) WHERE status = 'pending';