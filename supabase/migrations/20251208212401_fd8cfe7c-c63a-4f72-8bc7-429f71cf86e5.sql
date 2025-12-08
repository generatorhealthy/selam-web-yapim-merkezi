-- Add unique constraint for blog_post_id and platform combination
ALTER TABLE public.social_shares 
ADD CONSTRAINT social_shares_blog_platform_unique 
UNIQUE (blog_post_id, platform);

-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run every hour at minute 0 (3 posts per hour)
SELECT cron.schedule(
  'twitter-share-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-twitter-share',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);