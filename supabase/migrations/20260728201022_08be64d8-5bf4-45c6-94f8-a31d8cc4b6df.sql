-- AI otomatik danışan arama sistemi

CREATE TABLE IF NOT EXISTS public.ai_call_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  work_start_hour int NOT NULL DEFAULT 10,
  work_end_hour int NOT NULL DEFAULT 19,
  no_answer_window_end_hour int NOT NULL DEFAULT 12,
  max_calls_per_day int NOT NULL DEFAULT 2,
  retry_gap_minutes int NOT NULL DEFAULT 150,
  active_line_prefix text NOT NULL DEFAULT '80',
  line_prefixes text[] NOT NULL DEFAULT ARRAY['80','81'],
  line_cooldown_seconds int NOT NULL DEFAULT 150,
  line_80_busy_until timestamptz,
  line_81_busy_until timestamptz,
  voice text NOT NULL DEFAULT 'shimmer',
  system_prompt text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE ON public.ai_call_settings TO authenticated;
GRANT ALL ON public.ai_call_settings TO service_role;
ALTER TABLE public.ai_call_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_staff_manage_ai_call_settings" ON public.ai_call_settings
  FOR ALL TO authenticated USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

INSERT INTO public.ai_call_settings (enabled) SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.ai_call_settings);

CREATE TABLE IF NOT EXISTS public.ai_call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  lead_name text,
  lead_phone text,
  line_prefix text,
  channel_id text,
  status text NOT NULL DEFAULT 'dialing',
  outcome text,
  transferred_specialist_id uuid,
  transferred_specialist_name text,
  transferred_extension text,
  callback_at timestamptz,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  is_test boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_call_sessions_lead ON public.ai_call_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_sessions_started ON public.ai_call_sessions(started_at DESC);

GRANT SELECT ON public.ai_call_sessions TO authenticated;
GRANT ALL ON public.ai_call_sessions TO service_role;
ALTER TABLE public.ai_call_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_staff_read_ai_call_sessions" ON public.ai_call_sessions
  FOR SELECT TO authenticated USING (public.is_admin_or_staff());

CREATE TABLE IF NOT EXISTS public.ai_call_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  priority int NOT NULL DEFAULT 100,
  attempt_no int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  session_id uuid,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_call_queue_due ON public.ai_call_queue(status, scheduled_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_call_queue_pending_lead ON public.ai_call_queue(lead_id) WHERE status = 'pending';

GRANT SELECT ON public.ai_call_queue TO authenticated;
GRANT ALL ON public.ai_call_queue TO service_role;
ALTER TABLE public.ai_call_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_staff_read_ai_call_queue" ON public.ai_call_queue
  FOR SELECT TO authenticated USING (public.is_admin_or_staff());

ALTER TABLE public.danisan_basvurulari
  ADD COLUMN IF NOT EXISTS next_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS preferred_call_time text,
  ADD COLUMN IF NOT EXISTS daily_call_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_call_date date;