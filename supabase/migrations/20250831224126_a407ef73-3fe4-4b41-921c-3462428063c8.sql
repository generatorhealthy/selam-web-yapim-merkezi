-- Relax specialist orders view policy to tolerate honorifics and case differences
DROP POLICY IF EXISTS "Specialists can view their own approved orders" ON public.orders;

CREATE POLICY "Specialists can view their own approved orders"
ON public.orders
FOR SELECT
USING (
  status IN ('approved','completed')
  AND EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.user_id = auth.uid()
      AND (
        lower(s.email) = lower(orders.customer_email)
        OR lower(regexp_replace(s.name, '(psk\.|uzm\.|dr\.|psikolog|danışman|[[:space:]]+)', '', 'gi')) =
           lower(regexp_replace(orders.customer_name, '(psk\.|uzm\.|dr\.|psikolog|danışman|[[:space:]]+)', '', 'gi'))
      )
  )
);