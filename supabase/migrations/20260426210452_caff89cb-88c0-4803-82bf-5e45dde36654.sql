SELECT cron.unschedule('hashnode-share-hourly');

SELECT cron.schedule(
  'hashnode-share-twice-daily',
  '0 6,15 * * *',
  $$
  SELECT net.http_post(
    url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-hashnode-share',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);