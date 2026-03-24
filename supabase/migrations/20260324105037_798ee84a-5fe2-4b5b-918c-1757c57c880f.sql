
CREATE TABLE public.brevo_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sender_email TEXT NOT NULL DEFAULT 'info@doktorumol.com.tr',
  subject TEXT NOT NULL,
  template_name TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  brevo_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brevo_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can view email logs"
  ON public.brevo_email_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_staff_user());

CREATE POLICY "Service role can insert email logs"
  ON public.brevo_email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_brevo_email_logs_created_at ON public.brevo_email_logs(created_at DESC);
CREATE INDEX idx_brevo_email_logs_recipient ON public.brevo_email_logs(recipient_email);
CREATE INDEX idx_brevo_email_logs_template ON public.brevo_email_logs(template_name);
