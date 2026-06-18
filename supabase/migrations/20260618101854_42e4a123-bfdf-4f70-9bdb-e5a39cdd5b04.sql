CREATE TABLE IF NOT EXISTS public.pbx_missed_transfer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature text NOT NULL UNIQUE,
  call_date timestamptz,
  client_phone text,
  specialist_ext text,
  specialist_name text,
  specialist_phone text,
  whatsapp_specialist_ok boolean DEFAULT false,
  whatsapp_client_ok boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pbx_missed_transfer_notifications TO authenticated;
GRANT ALL ON public.pbx_missed_transfer_notifications TO service_role;

ALTER TABLE public.pbx_missed_transfer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view missed transfer notifications"
ON public.pbx_missed_transfer_notifications
FOR SELECT
TO authenticated
USING (public.is_admin_or_staff_user());