CREATE TABLE public.appointment_notification_claims (
  appointment_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'claimed',
  caller text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.appointment_notification_claims TO service_role;
ALTER TABLE public.appointment_notification_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notification claims" ON public.appointment_notification_claims
  FOR SELECT TO authenticated USING (public.is_admin_user());
GRANT SELECT ON public.appointment_notification_claims TO authenticated;