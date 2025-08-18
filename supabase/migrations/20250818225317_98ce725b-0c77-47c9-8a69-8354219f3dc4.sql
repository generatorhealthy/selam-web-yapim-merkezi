-- Function to increment client referrals when appointment is created
CREATE OR REPLACE FUNCTION public.increment_client_referral_on_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert or update client_referrals for the specialist
  INSERT INTO public.client_referrals (
    specialist_id,
    year,
    month,
    referral_count
  ) VALUES (
    NEW.specialist_id,
    EXTRACT(YEAR FROM NEW.created_at),
    EXTRACT(MONTH FROM NEW.created_at),
    1
  )
  ON CONFLICT (specialist_id, year, month) 
  DO UPDATE SET 
    referral_count = client_referrals.referral_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$function$

-- Create trigger for appointments table
CREATE TRIGGER trigger_increment_client_referral_on_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_client_referral_on_appointment();