-- DRAFT ONLY: NOT APPLIED. Re-read live definition/owner/cron before migration.
BEGIN;
CREATE OR REPLACE FUNCTION public.create_full_database_backup(p_backup_type text DEFAULT 'automatic'::text, p_created_by uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_backup_id bigint;
  v_backup_timestamp timestamptz := NOW();
  v_backup_suffix text;
  v_total_records integer := 0;
  v_tables_backed_up text[] := '{}';
  v_record_count integer;
  v_backup_table text;
BEGIN
  -- Never use current_user here: SECURITY DEFINER makes it the owner.
  -- Direct postgres cron job 23 is preserved; PostgREST SET ROLE cannot pass this branch.
  IF NOT (
    current_setting('role', true) = 'service_role'
    OR (session_user = 'postgres' AND current_setting('role', true) IN ('none', 'postgres')
        AND auth.uid() IS NULL)
    OR (current_setting('role', true) = 'authenticated' AND public.is_admin_user())
  ) THEN
    RAISE EXCEPTION 'Forbidden: approved admin or trusted database scheduler required'
      USING ERRCODE = '42501';
  END IF;
  IF current_setting('role', true) = 'authenticated' THEN
    p_created_by := auth.uid();
  END IF;
  v_backup_suffix := EXTRACT(EPOCH FROM v_backup_timestamp)::bigint::text;

  INSERT INTO public.database_backups (backup_type, backup_status, created_by, notes)
  VALUES (p_backup_type, 'in_progress', p_created_by, p_notes)
  RETURNING id INTO v_backup_id;

  -- Macro to backup a table and enable RLS
  -- Backup specialists
  v_backup_table := 'backup_' || v_backup_suffix || '_specialists';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.specialists';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'specialists');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup client_referrals
  v_backup_table := 'backup_' || v_backup_suffix || '_client_referrals';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.client_referrals';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'client_referrals');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup orders
  v_backup_table := 'backup_' || v_backup_suffix || '_orders';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.orders';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'orders');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup automatic_orders
  v_backup_table := 'backup_' || v_backup_suffix || '_automatic_orders';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.automatic_orders';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'automatic_orders');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup appointments
  v_backup_table := 'backup_' || v_backup_suffix || '_appointments';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.appointments';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'appointments');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup blog_posts
  v_backup_table := 'backup_' || v_backup_suffix || '_blog_posts';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.blog_posts';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'blog_posts');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup reviews
  v_backup_table := 'backup_' || v_backup_suffix || '_reviews';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.reviews';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'reviews');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup tests
  v_backup_table := 'backup_' || v_backup_suffix || '_tests';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.tests';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'tests');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup test_questions
  v_backup_table := 'backup_' || v_backup_suffix || '_test_questions';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.test_questions';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'test_questions');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup test_results
  v_backup_table := 'backup_' || v_backup_suffix || '_test_results';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.test_results';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'test_results');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup packages
  v_backup_table := 'backup_' || v_backup_suffix || '_packages';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.packages';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'packages');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

  -- Backup user_profiles
  v_backup_table := 'backup_' || v_backup_suffix || '_user_profiles';
  EXECUTE 'CREATE TABLE public.' || quote_ident(v_backup_table) || ' AS TABLE public.user_profiles';
  GET DIAGNOSTICS v_record_count = ROW_COUNT;
  v_total_records := v_total_records + v_record_count;
  v_tables_backed_up := array_append(v_tables_backed_up, 'user_profiles');
  EXECUTE 'ALTER TABLE public.' || quote_ident(v_backup_table) || ' ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY "Admin only access" ON public.' || quote_ident(v_backup_table) || ' FOR ALL TO authenticated USING (public.is_admin_user())';

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
$function$;

REVOKE ALL ON FUNCTION public.create_full_database_backup(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_full_database_backup(text,uuid,text) TO authenticated, service_role;
COMMIT;
