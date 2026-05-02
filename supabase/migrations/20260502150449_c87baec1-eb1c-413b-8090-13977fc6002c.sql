UPDATE public.orders
SET status = 'approved',
    approved_at = COALESCE(approved_at, now()),
    updated_at = now()
WHERE id = '90d966f5-c8fa-460e-836d-39483fe9339e'
  AND status = 'pending';