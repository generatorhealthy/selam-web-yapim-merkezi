-- Add eski_bilgilendirme field to call_reports table for Danışman category
ALTER TABLE public.call_reports 
ADD COLUMN IF NOT EXISTS danisma_eski_bilgilendirme integer NOT NULL DEFAULT 0;