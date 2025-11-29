-- Drop the trigger function that's causing the ON CONFLICT error
DROP TRIGGER IF EXISTS trigger_increment_client_referral_on_appointment ON public.appointments;
DROP FUNCTION IF EXISTS public.increment_client_referral_on_appointment();

-- Recreate the function without ON CONFLICT since we removed the unique constraint
-- This function now just tracks that an appointment was created, without trying to aggregate
CREATE OR REPLACE FUNCTION public.increment_client_referral_on_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Just insert a new referral record without ON CONFLICT
  -- since we removed the unique constraint to allow multiple referrals per month
  INSERT INTO public.client_referrals (
    specialist_id,
    year,
    month,
    referral_count,
    created_at,
    updated_at
  ) VALUES (
    NEW.specialist_id,
    EXTRACT(YEAR FROM NEW.created_at),
    EXTRACT(MONTH FROM NEW.created_at),
    1,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_increment_client_referral_on_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION increment_client_referral_on_appointment();