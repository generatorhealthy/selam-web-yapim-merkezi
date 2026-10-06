-- Yarıda kalan uzman kayıtlarına gönderilen hatırlatmaların takibi
CREATE TABLE public.registration_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_no integer NOT NULL,
  channel text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_no)
);

GRANT SELECT ON public.registration_reminders TO authenticated;
GRANT ALL ON public.registration_reminders TO service_role;

ALTER TABLE public.registration_reminders ENABLE ROW LEVEL SECURITY;

-- Yalnızca admin/staff panelde görebilir; yazma yalnızca service_role (edge function)
CREATE POLICY "Admin ve staff hatırlatma kayıtlarını görebilir"
ON public.registration_reminders
FOR SELECT
TO authenticated
USING (public.is_admin_or_staff_user());

-- Saatte bir yarıda kalan kayıtlara hatırlatma gönder (1 saat / 1 gün / 3 gün pencereleri)
SELECT cron.schedule(
  'send-registration-reminders-hourly-v1',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-registration-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '07e465ec6d61a2a5c8d9475ea5151b0ba1cc8f257a3acd2566ac179b6cf1a51c'
    ),
    body := jsonb_build_object('source', 'pg_cron')
  );
  $$
);