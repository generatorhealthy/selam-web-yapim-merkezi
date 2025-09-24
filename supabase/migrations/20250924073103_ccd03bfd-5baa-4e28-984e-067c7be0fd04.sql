-- Fix the time zone operator error by ensuring all timestamp columns are consistent

-- Update the update_updated_at_column function to use TIMESTAMPTZ consistently
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW()::TIMESTAMPTZ;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a new function specifically for handling timestamp operations safely
CREATE OR REPLACE FUNCTION public.safe_timestamp_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure all timestamp operations use proper timezone handling
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update triggers to use the safer timestamp function for specialists table
DROP TRIGGER IF EXISTS update_specialists_updated_at ON public.specialists;
CREATE TRIGGER update_specialists_updated_at
  BEFORE UPDATE ON public.specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_timestamp_update();

-- Update triggers for blog_posts table
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts  
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_timestamp_update();

-- Ensure all timestamp columns in specialists table are properly typed
ALTER TABLE public.specialists 
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure all timestamp columns in blog_posts table are properly typed  
ALTER TABLE public.blog_posts
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;