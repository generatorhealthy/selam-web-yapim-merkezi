
-- Add registration_source to specialists table
ALTER TABLE public.specialists ADD COLUMN IF NOT EXISTS registration_source text DEFAULT 'admin';

-- Create trigger function to auto-activate specialist when order is approved
CREATE OR REPLACE FUNCTION public.activate_specialist_on_order_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('approved', 'completed') AND OLD.status NOT IN ('approved', 'completed') THEN
    UPDATE public.specialists 
    SET is_active = true 
    WHERE email = NEW.customer_email 
      AND registration_source = 'self_registration' 
      AND is_active = false;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_activate_specialist_on_order_approval ON public.orders;
CREATE TRIGGER trigger_activate_specialist_on_order_approval
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.activate_specialist_on_order_approval();
