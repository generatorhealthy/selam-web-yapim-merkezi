ALTER TABLE public.whatsapp_bot_sessions
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_question text,
  ADD COLUMN IF NOT EXISTS last_options jsonb;

ALTER TABLE public.danisan_basvurulari
  ADD COLUMN IF NOT EXISTS wa_bot_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS wa_bot_error text;

CREATE INDEX IF NOT EXISTS idx_wa_bot_sessions_phone_state
  ON public.whatsapp_bot_sessions (phone, state, last_message_at DESC);