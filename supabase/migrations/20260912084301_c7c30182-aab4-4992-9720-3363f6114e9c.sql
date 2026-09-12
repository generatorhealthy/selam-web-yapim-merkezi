DROP POLICY IF EXISTS "Specialists can view their own orders" ON public.orders;

CREATE POLICY "Specialists can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  NOT public.is_admin_or_staff_user()
  AND status = ANY (ARRAY['pending'::text, 'approved'::text, 'completed'::text])
  AND EXISTS (
    SELECT 1
    FROM public.specialists s
    WHERE s.user_id = (SELECT auth.uid())
      AND (
        lower(s.email) = lower(orders.customer_email)
        OR lower(regexp_replace(s.name, '(psk\.|uzm\.|dr\.|psikolog|danışman|[[:space:]]+)', '', 'gi'))
           = lower(regexp_replace(orders.customer_name, '(psk\.|uzm\.|dr\.|psikolog|danışman|[[:space:]]+)', '', 'gi'))
      )
  )
);

DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
