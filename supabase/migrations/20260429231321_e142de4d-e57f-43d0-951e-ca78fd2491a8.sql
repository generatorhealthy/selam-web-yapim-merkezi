-- Önceki cron'ları temizleme YOK (memory: never DELETE from cron.job).
-- Eğer eski isimle kayıt varsa unschedule ile devre dışı bırakıp yeni isimle ekliyoruz.
DO $$
BEGIN
  PERFORM cron.unschedule('seo-auto-publish-v1');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 10 ayrı zaman diliminde tek bir cron çalıştırmak yerine, tek bir cron yapıp
-- her tetiklendiğinde 1 içerik üretmek daha basit. Ancak günde 10 olmak için
-- her gün 10 farklı saatte çalışacak şekilde 10 cron schedule ekliyoruz.
-- TR saati = UTC + 3, TR saatleri: 08,10,12,14,15,16,18,20,22,23 → UTC: 5,7,9,11,12,13,15,17,19,20

SELECT cron.schedule(
  'seo-auto-publish-v2-slot1',
  '0 5 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := '{"count":1}'::jsonb
  );
  $cron$
);

SELECT cron.schedule('seo-auto-publish-v2-slot2', '0 7 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot3', '0 9 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot4', '0 11 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot5', '0 12 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot6', '0 13 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot7', '0 15 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot8', '0 17 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot9', '0 19 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);

SELECT cron.schedule('seo-auto-publish-v2-slot10', '0 20 * * *', $cron$
  SELECT net.http_post(url:='https://irnfwewabogveofwemvg.supabase.co/functions/v1/seo-auto-publish-batch',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body:='{"count":1}'::jsonb);
$cron$);
