-- Add package_price column to specialists table
ALTER TABLE public.specialists 
ADD COLUMN package_price numeric;