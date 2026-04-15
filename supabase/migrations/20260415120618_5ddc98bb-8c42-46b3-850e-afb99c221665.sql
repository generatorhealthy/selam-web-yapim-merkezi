
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message_id TEXT,
  body TEXT,
  from_me BOOLEAN NOT NULL DEFAULT false,
  timestamp BIGINT NOT NULL DEFAULT 0,
  has_media BOOLEAN DEFAULT false,
  media_type TEXT,
  sender_name TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_chat ON public.whatsapp_messages (session_name, chat_id, timestamp DESC);
CREATE UNIQUE INDEX idx_whatsapp_messages_unique ON public.whatsapp_messages (session_name, chat_id, message_id) WHERE message_id IS NOT NULL;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can read whatsapp messages"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (public.is_admin_or_staff_user());

CREATE POLICY "Service role can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (true);
