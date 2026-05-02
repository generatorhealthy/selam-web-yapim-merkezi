-- 1) Bozuk cron job'ları unschedule et (supabase_read_only_user altında oluşmuş, net.http_post yetkisi yok)
DO $$
BEGIN
  -- poll-akbank-emails (her 2 dk)
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'poll-akbank-emails-every-2min'
    AND username = 'supabase_read_only_user';

  -- auto-approve-iyzico-orders
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'auto-approve-iyzico-orders'
    AND username = 'supabase_read_only_user';

  -- retry-failed-iyzico-payments (yanlış proje URL'li olan)
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'retry-failed-iyzico-payments'
    AND username = 'supabase_read_only_user';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Unschedule sırasında hata: %', SQLERRM;
END $$;

-- 2) Job'ları postgres kullanıcısı altında YENİ İSİMLERLE yeniden oluştur

-- Akbank email poll - her 2 dakikada bir
SELECT cron.schedule(
  'poll-akbank-emails-2min-v2',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/poll-akbank-emails',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- Iyzico otomatik onaylama
SELECT cron.schedule(
  'auto-approve-iyzico-orders-v2',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/auto-approve-iyzico-orders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"time": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- 3) Havvanur'un 1 Mayıs'taki pending siparişini manuel onayla (Akbank email'i geldi, ödeme tahsil edildi)
UPDATE public.orders
SET status = 'approved',
    approved_at = now()
WHERE id = '6ebfc35c-73ef-4591-a006-ff2719d11fac'
  AND status = 'pending';