-- Allow specialists to view their own approved/completed orders (contracts)
CREATE POLICY IF NOT EXISTS "Specialists can view their own approved orders"
ON public.orders
FOR SELECT
USING (
  (status IN ('approved','completed'))
  AND EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.user_id = auth.uid()
      AND (s.email = orders.customer_email OR s.name = orders.customer_name)
  )
);

-- Optional: make sure RLS is enabled (safety, will no-op if already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;