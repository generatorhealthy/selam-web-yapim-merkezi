-- Create SMS logs table for tracking
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL CHECK (status IN ('success','error')),
  used_function text,
  error text,
  response jsonb,
  triggered_by uuid,
  source text,
  specialist_id uuid,
  specialist_name text,
  client_name text,
  client_contact text
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Policies: admin or staff can manage logs
CREATE POLICY "SMS logs admin/staff full access"
ON public.sms_logs
FOR ALL
USING (public.is_admin_user() OR public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_user() OR public.is_admin_or_staff_user());

-- Index for recent queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs (created_at DESC);
