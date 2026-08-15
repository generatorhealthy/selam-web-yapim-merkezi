ALTER TABLE public.whatsapp_bot_settings
  ADD COLUMN IF NOT EXISTS auto_reply_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reply_test_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_reply_price_text text NOT NULL DEFAULT 'Fiyatlar, hani seans ücretleri, tamamını uzmanlarla görüşme sağlayabiliyorsunuz. Bilgileri uzmanlarımız sizlere aktaracaktır.',
  ADD COLUMN IF NOT EXISTS auto_reply_general_text text NOT NULL DEFAULT 'Merhaba, Doktorumol.com.tr ailesine hoş geldiniz. Size en uygun uzmanımızı yönlendirebilmemiz ve detaylı bilgi alabilmeniz için lütfen başvuru formumuzu doldurunuz. Uzmanlarımız kısa süre içinde sizinle iletişime geçecektir.',
  ADD COLUMN IF NOT EXISTS auto_reply_cooldown_minutes integer NOT NULL DEFAULT 60;

CREATE TABLE IF NOT EXISTS public.whatsapp_bot_auto_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL,
  chat_id text NOT NULL,
  phone text,
  incoming_body text,
  intent text NOT NULL,
  reply_text text NOT NULL,
  is_test boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_bot_auto_replies_chat ON public.whatsapp_bot_auto_replies (session_name, chat_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_bot_auto_replies TO authenticated;
GRANT ALL ON public.whatsapp_bot_auto_replies TO service_role;

ALTER TABLE public.whatsapp_bot_auto_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin staff manage wa bot auto replies"
  ON public.whatsapp_bot_auto_replies
  FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());