-- Add internal_number field to specialists table
ALTER TABLE public.specialists 
ADD COLUMN internal_number text;