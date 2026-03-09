
CREATE OR REPLACE FUNCTION public.send_contract_emails_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  email_enabled BOOLEAN := false;
BEGIN
  -- Eğer e-posta gönderimi pasifse, sadece flag'i güncelle ve çık
  SELECT setting_value INTO email_enabled 
  FROM public.system_settings 
  WHERE setting_key = 'send_completion_emails' 
  LIMIT 1;

  IF NOT COALESCE(email_enabled, false) THEN
    NEW.contract_emails_sent = true;
    NEW.approved_at = NOW();
    RETURN NEW;
  END IF;

  -- Only send emails when order is approved for the first time
  IF NEW.status IN ('approved', 'completed') 
     AND OLD.status NOT IN ('approved', 'completed') 
     AND NEW.contract_emails_sent = false THEN
    
    -- SADECE İLK SİPARİŞLERDE E-POSTA GÖNDER (subscription_month = 1 veya is_first_order = true)
    IF (NEW.subscription_month = 1 OR NEW.is_first_order = true) THEN
      -- Call edge function to send contract emails with HTML content
      PERFORM net.http_post(
        url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-order-documents-email',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
        body := jsonb_build_object(
          'customerEmail', NEW.customer_email,
          'customerName', NEW.customer_name,
          'packageName', NEW.package_name,
          'message', 'Sayın ' || NEW.customer_name || ', siparişiniz onaylanmıştır. Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmeniz aşağıda yer almaktadır.',
          'preInfoContent', COALESCE(NEW.pre_info_pdf_content, ''),
          'distanceSalesContent', COALESCE(NEW.distance_sales_pdf_content, '')
        )
      );
    END IF;
    
    -- Mark emails as sent and set approval time
    NEW.contract_emails_sent = true;
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;
