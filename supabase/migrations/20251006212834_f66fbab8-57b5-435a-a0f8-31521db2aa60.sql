-- Add available_time_slots column to specialists table
ALTER TABLE public.specialists 
ADD COLUMN available_time_slots JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.specialists.available_time_slots IS 'Array of time slots in HH:MM format that the specialist is available for appointments. Default slots from 09:30 to 21:00 in 30-minute intervals.';

-- Function to generate default time slots
CREATE OR REPLACE FUNCTION public.get_default_time_slots()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN '["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]'::jsonb;
END;
$$;

-- Update existing specialists with default time slots
UPDATE public.specialists 
SET available_time_slots = public.get_default_time_slots()
WHERE available_time_slots = '[]'::jsonb OR available_time_slots IS NULL;