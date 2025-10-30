-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create backup table for client_referrals
CREATE TABLE IF NOT EXISTS public.client_referrals_backup (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_timestamp timestamp with time zone DEFAULT now() NOT NULL,
  specialist_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  referral_count integer DEFAULT 0 NOT NULL,
  notes text,
  is_referred boolean DEFAULT false,
  referred_at timestamp with time zone,
  referred_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for faster queries by backup timestamp
CREATE INDEX IF NOT EXISTS idx_client_referrals_backup_timestamp 
ON public.client_referrals_backup(backup_timestamp DESC);

-- Function to backup client_referrals data
CREATE OR REPLACE FUNCTION public.backup_client_referrals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_backup_timestamp TIMESTAMPTZ := NOW();
BEGIN
  -- Insert current client_referrals data into backup table
  INSERT INTO public.client_referrals_backup (
    backup_timestamp,
    specialist_id,
    year,
    month,
    referral_count,
    notes,
    is_referred,
    referred_at,
    referred_by,
    created_at,
    updated_at
  )
  SELECT 
    v_backup_timestamp,
    specialist_id,
    year,
    month,
    referral_count,
    notes,
    is_referred,
    referred_at,
    referred_by,
    created_at,
    updated_at
  FROM public.client_referrals;
  
  -- Keep only last 30 days of backups to save storage
  DELETE FROM public.client_referrals_backup
  WHERE backup_timestamp < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Client referrals backup completed at %', v_backup_timestamp;
END;
$$;

-- Function to restore client_referrals from a specific backup
CREATE OR REPLACE FUNCTION public.restore_client_referrals_from_backup(p_backup_timestamp TIMESTAMPTZ)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if backup exists
  IF NOT EXISTS (
    SELECT 1 FROM public.client_referrals_backup 
    WHERE backup_timestamp = p_backup_timestamp
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Backup not found for timestamp: %', p_backup_timestamp;
  END IF;
  
  -- Clear current data
  TRUNCATE public.client_referrals;
  
  -- Restore from backup
  INSERT INTO public.client_referrals (
    specialist_id,
    year,
    month,
    referral_count,
    notes,
    is_referred,
    referred_at,
    referred_by,
    created_at,
    updated_at
  )
  SELECT 
    specialist_id,
    year,
    month,
    referral_count,
    notes,
    is_referred,
    referred_at,
    referred_by,
    created_at,
    updated_at
  FROM public.client_referrals_backup
  WHERE backup_timestamp = p_backup_timestamp;
  
  RAISE NOTICE 'Client referrals restored from backup: %', p_backup_timestamp;
END;
$$;

-- Function to list available backups
CREATE OR REPLACE FUNCTION public.list_client_referrals_backups()
RETURNS TABLE(
  backup_timestamp TIMESTAMPTZ,
  record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.backup_timestamp,
    COUNT(*) as record_count
  FROM public.client_referrals_backup b
  GROUP BY b.backup_timestamp
  ORDER BY b.backup_timestamp DESC;
END;
$$;

-- Schedule daily backup at 19:00 Turkey time (16:00 UTC)
-- Note: Using cron.schedule which runs on UTC time
SELECT cron.schedule(
  'daily-client-referrals-backup',
  '0 16 * * *', -- 16:00 UTC = 19:00 Turkey Time (GMT+3)
  $$
  SELECT public.backup_client_referrals();
  $$
);

-- Create an immediate backup now
SELECT public.backup_client_referrals();

-- Grant necessary permissions
ALTER TABLE public.client_referrals_backup ENABLE ROW LEVEL SECURITY;

-- Allow admins to view and manage backups
CREATE POLICY "Admins can view backups"
ON public.client_referrals_backup
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Admins can delete old backups"
ON public.client_referrals_backup
FOR DELETE
TO authenticated
USING (public.is_admin_user());