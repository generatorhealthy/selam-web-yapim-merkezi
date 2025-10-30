-- Drop existing objects if any
DROP TABLE IF EXISTS public.database_backups CASCADE;

-- Create main backup table that stores metadata about each backup
CREATE TABLE public.database_backups (
  id bigserial PRIMARY KEY,
  backup_timestamp timestamp with time zone DEFAULT now() NOT NULL,
  backup_type text NOT NULL DEFAULT 'automatic',
  backup_status text NOT NULL DEFAULT 'completed',
  tables_backed_up text[] NOT NULL DEFAULT '{}',
  total_records integer DEFAULT 0,
  created_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_database_backups_timestamp ON public.database_backups(backup_timestamp DESC);
CREATE INDEX idx_database_backups_type ON public.database_backups(backup_type);

-- Function to create a full database backup using timestamp-based naming
CREATE OR REPLACE FUNCTION public.create_full_database_backup(p_backup_type text DEFAULT 'automatic', p_created_by uuid DEFAULT NULL, p_notes text DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_backup_id bigint;
  v_backup_timestamp timestamptz := NOW();
  v_backup_suffix text;
  v_total_records integer := 0;
  v_tables_backed_up text[] := '{}';
  v_record_count integer;
BEGIN
  -- Generate safe backup suffix using epoch time
  v_backup_suffix := EXTRACT(EPOCH FROM v_backup_timestamp)::bigint::text;

  -- Create backup metadata record
  INSERT INTO public.database_backups (backup_type, backup_status, created_by, notes)
  VALUES (p_backup_type, 'in_progress', p_created_by, p_notes)
  RETURNING id INTO v_backup_id;

  -- Backup specialists table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_specialists AS TABLE public.specialists';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'specialists');

  -- Backup client_referrals table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_client_referrals AS TABLE public.client_referrals';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'client_referrals');

  -- Backup orders table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_orders AS TABLE public.orders';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'orders');

  -- Backup automatic_orders table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_automatic_orders AS TABLE public.automatic_orders';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'automatic_orders');

  -- Backup appointments table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_appointments AS TABLE public.appointments';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'appointments');

  -- Backup blog_posts table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_blog_posts AS TABLE public.blog_posts';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'blog_posts');

  -- Backup reviews table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_reviews AS TABLE public.reviews';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'reviews');

  -- Backup tests table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_tests AS TABLE public.tests';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'tests');

  -- Backup test_questions table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_test_questions AS TABLE public.test_questions';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'test_questions');

  -- Backup test_results table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_test_results AS TABLE public.test_results';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'test_results');

  -- Backup packages table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_packages AS TABLE public.packages';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'packages');

  -- Backup user_profiles table
  EXECUTE 'CREATE TABLE public.backup_' || v_backup_suffix || '_user_profiles AS TABLE public.user_profiles';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'user_profiles');

  -- Update backup metadata with results
  UPDATE public.database_backups
  SET backup_status = 'completed',
      backup_timestamp = v_backup_timestamp,
      tables_backed_up = v_tables_backed_up,
      total_records = v_total_records
  WHERE id = v_backup_id;

  RAISE NOTICE 'Full database backup completed: % tables, % records', array_length(v_tables_backed_up, 1), v_total_records;
  
  RETURN v_backup_id;
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.database_backups
    SET backup_status = 'failed',
        notes = COALESCE(notes || ' | ', '') || 'Error: ' || SQLERRM
    WHERE id = v_backup_id;
    RAISE EXCEPTION 'Backup failed: %', SQLERRM;
END;
$$;

-- Function to restore from a specific backup
CREATE OR REPLACE FUNCTION public.restore_from_backup(p_backup_id bigint, p_table_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_backup_timestamp timestamptz;
  v_backup_suffix text;
  v_tables_to_restore text[];
  v_table text;
BEGIN
  -- Get backup info
  SELECT backup_timestamp, tables_backed_up 
  INTO v_backup_timestamp, v_tables_to_restore
  FROM public.database_backups 
  WHERE id = p_backup_id AND backup_status = 'completed';

  IF v_backup_timestamp IS NULL THEN
    RAISE EXCEPTION 'Backup not found or incomplete: %', p_backup_id;
  END IF;

  v_backup_suffix := EXTRACT(EPOCH FROM v_backup_timestamp)::bigint::text;

  -- Get list of tables to restore
  IF p_table_name IS NOT NULL THEN
    v_tables_to_restore := ARRAY[p_table_name];
  END IF;

  -- Restore each table
  FOREACH v_table IN ARRAY v_tables_to_restore
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'backup_' || v_backup_suffix || '_' || v_table
    ) THEN
      EXECUTE 'TRUNCATE TABLE public.' || quote_ident(v_table) || ' CASCADE';
      EXECUTE 'INSERT INTO public.' || quote_ident(v_table) || 
              ' SELECT * FROM public.backup_' || v_backup_suffix || '_' || quote_ident(v_table);
      RAISE NOTICE 'Restored table: %', v_table;
    ELSE
      RAISE WARNING 'Backup table not found: backup_%_%', v_backup_suffix, v_table;
    END IF;
  END LOOP;

  RAISE NOTICE 'Database restore completed from backup: %', p_backup_id;
END;
$$;

-- Function to list all available backups
CREATE OR REPLACE FUNCTION public.list_database_backups()
RETURNS TABLE(
  id bigint,
  backup_timestamp timestamptz,
  backup_type text,
  backup_status text,
  tables_count integer,
  total_records integer,
  created_by uuid,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.backup_timestamp,
    b.backup_type,
    b.backup_status,
    array_length(b.tables_backed_up, 1) as tables_count,
    b.total_records,
    b.created_by,
    b.notes
  FROM public.database_backups b
  ORDER BY b.backup_timestamp DESC;
END;
$$;

-- Function to cleanup old backups
CREATE OR REPLACE FUNCTION public.cleanup_old_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_backup record;
  v_backup_suffix text;
  v_table_name text;
BEGIN
  FOR v_old_backup IN 
    SELECT id, backup_timestamp FROM public.database_backups 
    WHERE backup_timestamp < NOW() - INTERVAL '30 days'
  LOOP
    v_backup_suffix := EXTRACT(EPOCH FROM v_old_backup.backup_timestamp)::bigint::text;
    
    FOR v_table_name IN 
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'backup_' || v_backup_suffix || '_%'
    LOOP
      EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(v_table_name);
      RAISE NOTICE 'Dropped old backup table: %', v_table_name;
    END LOOP;
    
    DELETE FROM public.database_backups WHERE id = v_old_backup.id;
  END LOOP;
END;
$$;

-- Schedule daily full backup at 19:00 Turkey time (16:00 UTC)
SELECT cron.schedule(
  'daily-full-database-backup',
  '0 16 * * *',
  $$
  SELECT public.create_full_database_backup('automatic', NULL, 'Scheduled daily backup');
  SELECT public.cleanup_old_backups();
  $$
);

-- Create an immediate backup
SELECT public.create_full_database_backup('manual', NULL, 'Initial backup setup');

-- Enable RLS
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage database backups"
ON public.database_backups
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());