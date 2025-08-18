-- Create trigger for appointments table to increment client referrals
CREATE TRIGGER trigger_increment_client_referral_on_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_client_referral_on_appointment();