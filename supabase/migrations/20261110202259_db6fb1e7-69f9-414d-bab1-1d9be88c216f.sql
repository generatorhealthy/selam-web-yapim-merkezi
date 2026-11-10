CREATE OR REPLACE FUNCTION public.send_first_order_sms_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.subscription_month = 1 OR NEW.is_first_order = true THEN
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-sms-via-static-proxy',
      headers := '{"Content-Type": "application/json", "x-cron-secret": "07e465ec6d61a2a5c8d9475ea5151b0ba1cc8f257a3acd2566ac179b6cf1a51c", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := jsonb_build_object(
        'phone', '05316852275',
        'message', format(
          'YENI KAYIT! %s - %s - %s - %s - %s TL - %s',
          NEW.customer_name,
          COALESCE(NEW.customer_phone, 'Tel yok'),
          NEW.package_name,
          COALESCE(NEW.customer_city, 'Sehir yok'),
          NEW.amount::text,
          TO_CHAR(NEW.created_at, 'DD.MM.YYYY HH24:MI')
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
CREATE POLICY "Users upload profile pictures to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    OR public.is_admin_or_staff_user()
  )
);

DROP POLICY IF EXISTS "Authenticated can upload blog images" ON storage.objects;
CREATE POLICY "Admin staff can upload blog images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images' AND public.is_admin_or_staff_user());