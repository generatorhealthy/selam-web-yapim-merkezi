
-- Table to track login attempts and blocks for admin panel
CREATE TABLE public.admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_admin_login_attempts_email ON public.admin_login_attempts(email);
CREATE INDEX idx_admin_login_attempts_blocked ON public.admin_login_attempts(is_blocked, blocked_until);

-- Unique constraint on email to have one record per user
CREATE UNIQUE INDEX idx_admin_login_attempts_email_unique ON public.admin_login_attempts(email);

-- Enable RLS but allow public access for login checks (anon key access)
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserting/updating for login tracking (public access needed for login page)
CREATE POLICY "Allow public read for login check"
  ON public.admin_login_attempts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert for login tracking"
  ON public.admin_login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update for login tracking"
  ON public.admin_login_attempts FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.check_admin_login_block(p_email TEXT)
RETURNS TABLE(is_blocked BOOLEAN, blocked_until TIMESTAMPTZ, attempts_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record 
  FROM public.admin_login_attempts 
  WHERE email = LOWER(p_email);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, 3;
    RETURN;
  END IF;
  
  -- Check if block has expired
  IF v_record.is_blocked AND v_record.blocked_until IS NOT NULL THEN
    IF v_record.blocked_until <= NOW() THEN
      -- Block expired, reset the record
      UPDATE public.admin_login_attempts 
      SET is_blocked = false, 
          attempt_count = 0, 
          blocked_until = NULL,
          last_attempt_at = NOW()
      WHERE email = LOWER(p_email);
      
      RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, 3;
      RETURN;
    ELSE
      -- Still blocked
      RETURN QUERY SELECT true, v_record.blocked_until, 0;
      RETURN;
    END IF;
  END IF;
  
  -- Not blocked, return remaining attempts
  RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, GREATEST(0, 3 - v_record.attempt_count)::INTEGER;
END;
$$;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_admin_login(p_email TEXT, p_ip_address TEXT DEFAULT NULL)
RETURNS TABLE(is_now_blocked BOOLEAN, blocked_until TIMESTAMPTZ, attempts_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_new_count INTEGER;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record 
  FROM public.admin_login_attempts 
  WHERE email = LOWER(p_email);
  
  IF NOT FOUND THEN
    -- First failed attempt
    INSERT INTO public.admin_login_attempts (email, ip_address, attempt_count, last_attempt_at)
    VALUES (LOWER(p_email), p_ip_address, 1, NOW());
    
    RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, 2;
    RETURN;
  END IF;
  
  -- Check if already blocked
  IF v_record.is_blocked AND v_record.blocked_until > NOW() THEN
    RETURN QUERY SELECT true, v_record.blocked_until, 0;
    RETURN;
  END IF;
  
  -- Increment attempt count
  v_new_count := v_record.attempt_count + 1;
  
  -- Check if should be blocked (3 failed attempts)
  IF v_new_count >= 3 THEN
    v_blocked_until := NOW() + INTERVAL '3 hours';
    
    UPDATE public.admin_login_attempts 
    SET attempt_count = v_new_count,
        is_blocked = true,
        blocked_until = v_blocked_until,
        ip_address = COALESCE(p_ip_address, ip_address),
        last_attempt_at = NOW()
    WHERE email = LOWER(p_email);
    
    RETURN QUERY SELECT true, v_blocked_until, 0;
    RETURN;
  END IF;
  
  -- Just increment count
  UPDATE public.admin_login_attempts 
  SET attempt_count = v_new_count,
      ip_address = COALESCE(p_ip_address, ip_address),
      last_attempt_at = NOW()
  WHERE email = LOWER(p_email);
  
  RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, (3 - v_new_count)::INTEGER;
END;
$$;

-- Function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_admin_login_attempts(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_login_attempts 
  SET attempt_count = 0,
      is_blocked = false,
      blocked_until = NULL,
      last_attempt_at = NOW()
  WHERE email = LOWER(p_email);
END;
$$;
