CREATE TABLE IF NOT EXISTS public.mobile_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_email text,
  user_role text,
  action_type text NOT NULL DEFAULT 'page_view',
  page_url text,
  page_title text,
  details text,
  platform text,
  is_native boolean DEFAULT false,
  app_version text,
  device_info text,
  user_agent text,
  session_id text,
  session_start timestamptz,
  session_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobile_activity_logs_user_id ON public.mobile_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_activity_logs_created_at ON public.mobile_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_activity_logs_session_id ON public.mobile_activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mobile_activity_logs_user_role ON public.mobile_activity_logs(user_role);

ALTER TABLE public.mobile_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own mobile activity logs"
  ON public.mobile_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin and staff can read mobile activity logs"
  ON public.mobile_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can delete mobile activity logs"
  ON public.mobile_activity_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );