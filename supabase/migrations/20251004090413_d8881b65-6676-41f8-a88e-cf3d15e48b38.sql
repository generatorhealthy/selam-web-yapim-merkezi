-- Disable automatic order creation trigger
DROP TRIGGER IF EXISTS create_automatic_order_on_approval ON public.orders;

-- Drop the trigger function that creates automatic orders
DROP FUNCTION IF EXISTS public.create_automatic_order_schedule();