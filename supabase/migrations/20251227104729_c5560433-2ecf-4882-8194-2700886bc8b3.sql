-- Create a function to send SMS notification for first-time orders
CREATE OR REPLACE FUNCTION public.send_first_order_sms_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only send SMS for first-time orders (subscription_month = 1 or is_first_order = true)
  IF NEW.subscription_month = 1 OR NEW.is_first_order = true THEN
    -- Call the edge function to send SMS to admin
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-sms-via-static-proxy',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
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
$$;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS on_first_order_created ON public.orders;
CREATE TRIGGER on_first_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_first_order_sms_notification();