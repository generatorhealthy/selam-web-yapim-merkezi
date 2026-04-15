DROP POLICY IF EXISTS "Specialists can view their own approved orders" ON public.orders;

CREATE POLICY "Specialists can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (
  status IN ('pending', 'approved', 'completed')
  AND EXISTS (
    SELECT 1 FROM specialists s
    WHERE s.user_id = auth.uid()
    AND (
      lower(s.email) = lower(orders.customer_email)
      OR lower(regexp_replace(s.name, '(psk\.|uzm\.|dr\.|psikolog|danışman|[[:space:]]+)', '', 'gi')) = lower(regexp_replace(orders.customer_name, '(psk\.|uzm\.|dr\.|psikolog|danışman|[[:space:]]+)', '', 'gi'))
    )
  )
);