-- Add consultation_topic column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_topic text;

COMMENT ON COLUMN public.appointments.consultation_topic IS 'Danışmanlık konusu/türü - danışanların hangi konuda destek aldıklarını belirtir';