-- Fix security warning by adding search_path to the function
DROP FUNCTION IF EXISTS public.get_default_time_slots();

CREATE OR REPLACE FUNCTION public.get_default_time_slots()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN '["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]'::jsonb;
END;
$$;