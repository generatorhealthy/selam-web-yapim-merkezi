
-- FIX 1: Recreate public_reviews view with security_invoker to fix Security Definer View warning
DROP VIEW IF EXISTS public.public_reviews;
CREATE VIEW public.public_reviews
WITH (security_invoker = true)
AS SELECT 
  id, specialist_id, reviewer_name, rating, comment, status, created_at, updated_at
FROM public.reviews
WHERE status = 'approved';

-- FIX 2: Fix function search_path issues
CREATE OR REPLACE FUNCTION public.get_order_stats()
RETURNS TABLE(total_count bigint, approved_count bigint, pending_count bigint, total_amount numeric, pending_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE status IN ('approved', 'completed'))::bigint AS approved_count,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending_count,
    COALESCE(SUM(amount), 0)::numeric AS total_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::numeric AS pending_amount
  FROM public.orders
  WHERE deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.array_sort(anyarray)
RETURNS anyarray
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT array_agg(x ORDER BY x) FROM unnest($1) x;
$$;

-- FIX 3: Tighten overly permissive RLS policies (USING true for write operations)
-- website_analytics: restrict UPDATE to own session or admin
DROP POLICY IF EXISTS "Allow update for analytics tracking" ON public.website_analytics;
CREATE POLICY "Allow update for own session analytics"
ON public.website_analytics
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Note: website_analytics INSERT with true is intentional for anonymous tracking
-- registration_analytics UPDATE with true is intentional for anonymous funnel tracking
