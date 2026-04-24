-- Eski cron job'ları kaldır (varsa)
DO $$
DECLARE
  job_name text;
BEGIN
  FOR job_name IN 
    SELECT jobname FROM cron.job 
    WHERE jobname IN (
      'twitter-share-hourly-1','twitter-share-hourly-2','twitter-share-hourly-3',
      'linkedin-share-hourly-1','linkedin-share-hourly-2','linkedin-share-hourly-3',
      'multi-share-hourly'
    )
  LOOP
    PERFORM cron.unschedule(job_name);
  END LOOP;
END $$;

-- Yeni birleşik paylaşım job'u: her gün UTC 04:00-23:00 (TR 07:00-02:00) saat başı = 20 paylaşım/gün
SELECT cron.schedule(
  'multi-share-hourly',
  '0 4-23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-multi-share',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);