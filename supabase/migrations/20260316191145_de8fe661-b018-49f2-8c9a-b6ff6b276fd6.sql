
-- 1. Stop daily backup cron jobs
SELECT cron.unschedule('daily-full-database-backup');
SELECT cron.unschedule('daily-client-referrals-backup');

-- 2. Drop ALL backup tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'backup_%'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(t) || ' CASCADE';
    RAISE NOTICE 'Dropped: %', t;
  END LOOP;
END $$;

-- 3. Clean up backup metadata
TRUNCATE public.database_backups;

-- 4. Also clean client_referrals_backup table
TRUNCATE public.client_referrals_backup;
