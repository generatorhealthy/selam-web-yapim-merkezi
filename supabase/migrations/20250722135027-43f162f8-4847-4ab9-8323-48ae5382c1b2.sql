-- Add deleted_at column to orders table for soft delete functionality
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;