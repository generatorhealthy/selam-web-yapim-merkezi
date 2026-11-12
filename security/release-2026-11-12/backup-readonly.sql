-- Run only AFTER 2026-11-13 16:00 UTC. SELECT only; never triggers backup/cleanup.
SELECT now() AS checked_at,jobid,status,start_time,end_time,
 CASE WHEN status='failed' THEN return_message END AS failure
FROM cron.job_run_details WHERE jobid IN (23,24) AND start_time>='2026-11-13 16:00:00+00' ORDER BY start_time DESC;
SELECT jobid,jobname,active,schedule FROM cron.job WHERE jobid IN (23,24);
SELECT backup_timestamp,backup_status,tables_backed_up,total_records FROM public.database_backups
WHERE backup_timestamp>='2026-11-13 16:00:00+00' ORDER BY backup_timestamp DESC;
SELECT c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') AS anon_select,
 has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname ~ '^backup_[0-9]+_' ORDER BY c.relname;
SELECT tablename,policyname,roles,cmd,qual FROM pg_policies
WHERE schemaname='public' AND tablename ~ '^backup_[0-9]+_' ORDER BY tablename;
SELECT has_function_privilege('anon','public.create_full_database_backup(text,uuid,text)','EXECUTE') AS anon_execute;
-- Exact new table COUNT queries must be assembled from verified metadata names, then run SELECTs.
-- Compare their sum with recorded total_records and 12 names with tables_backed_up; current source
-- counts may legitimately differ after the snapshot. Cron23 success covers its cleanup call,
-- but retention/table inventory must also be inspected. No DML/DO/EXECUTE in this file.