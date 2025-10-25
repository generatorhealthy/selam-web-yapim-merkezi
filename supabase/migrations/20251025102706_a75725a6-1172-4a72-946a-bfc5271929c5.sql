-- Add image_url column to tests table
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS image_url TEXT;