CREATE OR REPLACE FUNCTION public.restore_from_backup(p_backup_id bigint, p_table_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_backup_timestamp timestamptz;
  v_backup_suffix text;
  v_tables_to_restore text[];
  v_table text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

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
$function$
