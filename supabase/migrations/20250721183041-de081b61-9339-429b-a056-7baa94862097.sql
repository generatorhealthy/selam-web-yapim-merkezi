-- Trigger'ı güncelle - orderId'yi de gönderelim
CREATE OR REPLACE FUNCTION public.send_contract_emails_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only send emails when order is approved for the first time
  IF NEW.status IN ('approved', 'completed') 
     AND OLD.status NOT IN ('approved', 'completed') 
     AND NEW.contract_emails_sent = false THEN
    
    -- Call the edge function to send contract emails with order ID
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-contract-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := jsonb_build_object(
        'orderId', NEW.id,
        'customerData', jsonb_build_object(
          'name', NEW.customer_name,
          'surname', '',
          'email', NEW.customer_email,
          'phone', NEW.customer_phone,
          'tcNo', NEW.customer_tc_no,
          'address', NEW.customer_address,
          'city', NEW.customer_city,
          'customerType', NEW.customer_type,
          'companyName', NEW.company_name,
          'taxNo', NEW.company_tax_no,
          'taxOffice', NEW.company_tax_office
        ),
        'packageData', jsonb_build_object(
          'name', NEW.package_name,
          'price', NEW.amount,
          'originalPrice', NEW.amount
        ),
        'paymentMethod', NEW.payment_method,
        'clientIP', COALESCE(NEW.contract_ip_address, '127.0.0.1')
      )
    );
    
    -- Mark emails as sent
    NEW.contract_emails_sent = true;
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;