
CREATE OR REPLACE FUNCTION public.auto_create_invoice_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Sadece status approved veya completed olduğunda ve daha önce fatura kesilmemişse çalış
  IF NEW.status IN ('approved', 'completed') 
     AND OLD.status NOT IN ('approved', 'completed') 
     AND (NEW.invoice_sent IS NULL OR NEW.invoice_sent = false) THEN
    
    -- Edge function'ı çağırarak fatura oluştur
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/create-birfatura-invoice',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := jsonb_build_object('orderId', NEW.id)
    );
    
    RAISE NOTICE 'Auto invoice creation triggered for order: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_auto_create_invoice_on_approval ON public.orders;
CREATE TRIGGER trigger_auto_create_invoice_on_approval
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_invoice_on_approval();
