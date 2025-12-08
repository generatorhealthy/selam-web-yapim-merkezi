-- Remove existing hourly cron job
SELECT cron.unschedule('twitter-share-hourly');

-- Create 3 cron jobs at different random-ish minutes within the hour
-- Job 1: runs at minute 7 of every hour
SELECT cron.schedule(
  'twitter-share-1',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-twitter-share',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Job 2: runs at minute 27 of every hour
SELECT cron.schedule(
  'twitter-share-2',
  '27 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-twitter-share',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Job 3: runs at minute 47 of every hour
SELECT cron.schedule(
  'twitter-share-3',
  '47 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-twitter-share',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);