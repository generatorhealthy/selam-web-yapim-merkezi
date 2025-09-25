-- Update RLS policies for website_analytics to ensure proper access
DROP POLICY IF EXISTS "Analytics insert policy" ON public.website_analytics;
DROP POLICY IF EXISTS "Analytics update policy" ON public.website_analytics;

-- Create more permissive policies for analytics tracking
CREATE POLICY "Allow analytics tracking inserts" 
ON public.website_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow analytics tracking updates" 
ON public.website_analytics 
FOR UPDATE 
USING (true) 
WITH CHECK (true);