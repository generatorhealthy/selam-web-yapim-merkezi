-- 1) Mevcut Twitter cron'larını durdur
SELECT cron.unschedule('twitter-share-half-hourly-1');
SELECT cron.unschedule('twitter-share-half-hourly-2');

-- 2) Yeni günlük 10 tweet cron'u (TR saatiyle 08:00, 09:30, 10:00, 12:00, 14:00, 16:00, 18:00, 18:30, 20:00, 21:30)
-- UTC karşılıkları: 05:00, 06:30, 07:00, 09:00, 11:00, 13:00, 15:00, 15:30, 17:00, 18:30
-- Cron formatı: minute hour day month dow
-- Saat başı atışlar: 05, 07, 09, 11, 13, 15, 17 UTC → "0 5,7,9,11,13,15,17 * * *"
-- Yarım saatli atışlar: 06:30, 15:30, 18:30 UTC → "30 6,15,18 * * *"
-- Toplam: 7 + 3 = 10 tweet/gün

-- Wrapper: 1 Mayıs 2026'dan ÖNCE çalışmaması için bir guard fonksiyonu
CREATE OR REPLACE FUNCTION public.invoke_twitter_share_after_may1()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1 Mayıs 2026 00:00 TR (30 Nisan 21:00 UTC) öncesinde çalışmasın
  IF now() < '2026-04-30 21:00:00+00'::timestamptz THEN
    RAISE NOTICE 'Twitter share paused until 2026-05-01 (TR)';
    RETURN;
  END IF;
  
  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/scheduled-twitter-share',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

-- Saat başı atışlar (7 adet)
SELECT cron.schedule(
  'twitter-share-daily-hourly',
  '0 5,7,9,11,13,15,17 * * *',
  $$ SELECT public.invoke_twitter_share_after_may1(); $$
);

-- Yarım saatli atışlar (3 adet)
SELECT cron.schedule(
  'twitter-share-daily-halfhour',
  '30 6,15,18 * * *',
  $$ SELECT public.invoke_twitter_share_after_may1(); $$
);