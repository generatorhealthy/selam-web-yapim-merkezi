ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS refresh_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refresh_note text;

CREATE INDEX IF NOT EXISTS idx_blog_posts_last_refreshed_at ON public.blog_posts (last_refreshed_at DESC NULLS LAST);

SELECT cron.schedule(
  'refresh-old-blog-content-daily-v1',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/refresh-old-blog-content',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', 'dokblog_refresh_2026_9f3ac71d5b'),
    body := jsonb_build_object('limit', 3)
  );
  $$
);