-- Sipariş tamamlandığında e-posta gönderimini kontrol etmek için ayar tablosu oluştur
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- E-posta gönderim ayarını ekle (başlangıçta pasif)
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('send_completion_emails', false, 'Sipariş tamamlandığında müşteriye e-posta gönderimini kontrol eder')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = false;

-- RLS politikası ekle
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System settings admin policy" 
ON public.system_settings 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

-- Mevcut contract email fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION public.send_contract_emails_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  email_enabled BOOLEAN := false;
BEGIN
  -- E-posta gönderim ayarını kontrol et
  SELECT setting_value INTO email_enabled 
  FROM public.system_settings 
  WHERE setting_key = 'send_completion_emails' 
  LIMIT 1;
  
  -- Eğer e-posta gönderimi pasifse, sadece flag'i güncelle ve çık
  IF NOT COALESCE(email_enabled, false) THEN
    NEW.contract_emails_sent = true;
    NEW.approved_at = NOW();
    RETURN NEW;
  END IF;

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