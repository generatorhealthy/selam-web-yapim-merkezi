-- Remove automatic client referral increment on appointment creation
-- Drop the trigger with correct name
DROP TRIGGER IF EXISTS trigger_increment_client_referral_on_appointment ON public.appointments;

-- Drop the function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS public.increment_client_referral_on_appointment() CASCADE;