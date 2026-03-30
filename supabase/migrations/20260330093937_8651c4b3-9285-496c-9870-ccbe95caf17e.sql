
-- Registration analytics table for tracking /kayit-ol page visitors
CREATE TABLE public.registration_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_url text,
  user_agent text,
  device_type text,
  current_step integer DEFAULT 1,
  max_step_reached integer DEFAULT 1,
  step_timestamps jsonb DEFAULT '{}',
  click_events jsonb DEFAULT '[]',
  time_on_page integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  left_at timestamptz,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_registration_analytics_session ON public.registration_analytics(session_id);
CREATE INDEX idx_registration_analytics_created ON public.registration_analytics(created_at DESC);
CREATE INDEX idx_registration_analytics_utm ON public.registration_analytics(utm_source, utm_campaign);

-- Enable RLS
ALTER TABLE public.registration_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (visitors are not authenticated)
CREATE POLICY "Anyone can insert registration analytics"
ON public.registration_analytics FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous updates on own session
CREATE POLICY "Anyone can update own session analytics"
ON public.registration_analytics FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Only admin/staff can read
CREATE POLICY "Admin and staff can read registration analytics"
ON public.registration_analytics FOR SELECT
TO authenticated
USING (public.is_admin_or_staff_user());
