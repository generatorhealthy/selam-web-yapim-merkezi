GRANT UPDATE ON cron.job TO supabase_read_only_user;
GRANT DELETE ON cron.job TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION cron.alter_job(bigint, text, text, text, text, boolean) TO supabase_read_only_user;