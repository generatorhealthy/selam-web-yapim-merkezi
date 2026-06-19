CREATE OR REPLACE FUNCTION public.notify_doki_bank_transfer_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payment_method IN ('banka_havalesi', 'bank_transfer')
     AND COALESCE(NEW.status, 'pending') = 'pending'
     AND NEW.deleted_at IS NULL THEN
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/doki-bank-transfer-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs',
        'x-cron-secret', '07e465ec6d61a2a5c8d9475ea5151b0ba1cc8f257a3acd2566ac179b6cf1a51c'
      ),
      body := jsonb_build_object('orderId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_doki_bank_transfer_order ON public.orders;

CREATE TRIGGER trg_notify_doki_bank_transfer_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_doki_bank_transfer_order();