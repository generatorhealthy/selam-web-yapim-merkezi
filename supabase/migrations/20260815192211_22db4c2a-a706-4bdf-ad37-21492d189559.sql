CREATE TABLE public.whatsapp_bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  test_mode boolean NOT NULL DEFAULT true,
  urgent_days integer NOT NULL DEFAULT 20,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_bot_settings TO authenticated;
GRANT ALL ON public.whatsapp_bot_settings TO service_role;
ALTER TABLE public.whatsapp_bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin staff manage wa bot settings" ON public.whatsapp_bot_settings
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
INSERT INTO public.whatsapp_bot_settings (enabled, test_mode) VALUES (false, true);

CREATE TABLE public.whatsapp_bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  phone text NOT NULL,
  client_name text,
  therapy_type text,
  consultation_type text,
  city text,
  state text NOT NULL DEFAULT 'awaiting_consent',
  selected_specialist_id uuid,
  selection_reason text,
  offered_online_fallback boolean NOT NULL DEFAULT false,
  is_test boolean NOT NULL DEFAULT true,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_bot_sessions TO authenticated;
GRANT ALL ON public.whatsapp_bot_sessions TO service_role;
ALTER TABLE public.whatsapp_bot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin staff manage wa bot sessions" ON public.whatsapp_bot_sessions
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
CREATE INDEX idx_wa_bot_sessions_phone ON public.whatsapp_bot_sessions (phone);
CREATE INDEX idx_wa_bot_sessions_state ON public.whatsapp_bot_sessions (state);