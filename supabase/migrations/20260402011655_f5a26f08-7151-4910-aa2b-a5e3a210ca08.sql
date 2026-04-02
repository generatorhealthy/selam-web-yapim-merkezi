DROP FUNCTION IF EXISTS public.get_order_stats();

CREATE OR REPLACE FUNCTION public.get_order_stats()
RETURNS TABLE(total_count bigint, approved_count bigint, pending_count bigint, total_amount numeric, pending_amount numeric) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
