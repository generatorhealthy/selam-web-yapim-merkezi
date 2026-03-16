
-- Update cleanup_old_backups to keep only 3 days instead of 30
CREATE OR REPLACE FUNCTION public.cleanup_old_backups()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_backup record;
  v_backup_suffix text;
  v_table_name text;
BEGIN
  FOR v_old_backup IN 
    SELECT id, backup_timestamp FROM public.database_backups 
    WHERE backup_timestamp < NOW() - INTERVAL '3 days'
  LOOP
    v_backup_suffix := EXTRACT(EPOCH FROM v_old_backup.backup_timestamp)::bigint::text;
    
    FOR v_table_name IN 
      SELECT t.table_name 
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' 
      AND t.table_name LIKE 'backup_' || v_backup_suffix || '_%'
    LOOP
      EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(v_table_name);
    END LOOP;
    
    DELETE FROM public.database_backups WHERE id = v_old_backup.id;
  END LOOP;
END;
$function$;

-- Update client referrals backup to keep only 3 days
CREATE OR REPLACE FUNCTION public.backup_client_referrals()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_backup_timestamp TIMESTAMPTZ := NOW();
BEGIN
  INSERT INTO public.client_referrals_backup (
    backup_timestamp, specialist_id, year, month, referral_count, notes,
    is_referred, referred_at, referred_by, created_at, updated_at
  )
  SELECT v_backup_timestamp, specialist_id, year, month, referral_count, notes,
    is_referred, referred_at, referred_by, created_at, updated_at
  FROM public.client_referrals;
  
  -- Keep only last 3 days
  DELETE FROM public.client_referrals_backup
  WHERE backup_timestamp < NOW() - INTERVAL '3 days';
END;
$function$;

-- Re-enable daily backup cron jobs
SELECT cron.schedule(
  'daily-full-database-backup',
  '0 16 * * *',
  $$
  SELECT public.create_full_database_backup('automatic', NULL, 'Scheduled daily backup');
  SELECT public.cleanup_old_backups();
  $$
);

SELECT cron.schedule(
  'daily-client-referrals-backup',
  '0 16 * * *',
  $$
  SELECT public.backup_client_referrals();
  $$
);
