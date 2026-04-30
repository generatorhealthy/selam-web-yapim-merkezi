CREATE OR REPLACE FUNCTION public.notify_doki_bank_transfer_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sadece banka havalesi ve pending siparişlerde tetikle
  IF NEW.payment_method IN ('banka_havalesi', 'bank_transfer')
     AND COALESCE(NEW.status, 'pending') = 'pending'
     AND NEW.deleted_at IS NULL THEN
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/doki-bank-transfer-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
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