
-- Admin/Staff panel activity logs table
CREATE TABLE public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  action_type TEXT NOT NULL DEFAULT 'page_view',
  page_url TEXT,
  page_title TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_start TIMESTAMPTZ,
  session_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_admin_activity_logs_user_id ON public.admin_activity_logs(user_id);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can read
CREATE POLICY "Admin can read all activity logs"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Admin and staff can insert their own logs
CREATE POLICY "Authenticated users can insert own logs"
  ON public.admin_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
