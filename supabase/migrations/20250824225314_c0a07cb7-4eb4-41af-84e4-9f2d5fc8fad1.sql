-- Fix the security definer view issue by dropping it
-- We'll use a different approach for hiding specialist contact info
DROP VIEW IF EXISTS public.specialists_public;

-- Fix website_analytics RLS policy to allow proper insertion
DROP POLICY IF EXISTS "Public can insert analytics" ON public.website_analytics;
DROP POLICY IF EXISTS "Public can update analytics" ON public.website_analytics;

CREATE POLICY "Analytics insert policy" 
ON public.website_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Analytics update policy" 
ON public.website_analytics 
FOR UPDATE 
USING (true)
WITH CHECK (true);