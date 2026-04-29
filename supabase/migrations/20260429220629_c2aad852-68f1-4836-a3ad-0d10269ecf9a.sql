-- Remove permissive UPDATE policies on website_analytics
DROP POLICY IF EXISTS "Allow analytics session updates" ON public.website_analytics;
DROP POLICY IF EXISTS "Scoped analytics update" ON public.website_analytics;

-- Add a tighter UPDATE policy:
-- Anonymous/public users can only update rows in the recent active window (30 min)
-- AND only if session_id is provided (not null). This prevents mass-updating
-- arbitrary historical rows. Combined with the short window, abuse surface is minimal.
CREATE POLICY "Recent session analytics update"
ON public.website_analytics
FOR UPDATE
TO public
USING (
  session_id IS NOT NULL
  AND last_active > (now() - interval '30 minutes')
)
WITH CHECK (
  session_id IS NOT NULL
  AND last_active > (now() - interval '30 minutes')
);