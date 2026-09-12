DROP POLICY IF EXISTS "Orders admin read policy" ON public.orders;
CREATE POLICY "Orders admin read policy"
ON public.orders
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()));

DROP POLICY IF EXISTS "Specialists can view their own orders" ON public.orders;
CREATE POLICY "Specialists can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  NOT (SELECT public.is_admin_or_staff_user())
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

DROP POLICY IF EXISTS "Orders admin update policy" ON public.orders;
CREATE POLICY "Orders admin update policy"
ON public.orders
FOR UPDATE
TO authenticated
USING ((SELECT public.is_admin_user()) OR (SELECT public.is_admin_or_staff_user()));

DROP POLICY IF EXISTS "Orders admin delete policy" ON public.orders;
CREATE POLICY "Orders admin delete policy"
ON public.orders
FOR DELETE
TO authenticated
USING ((SELECT public.is_admin_user()));

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_role ON public.user_profiles (user_id, role, is_approved);
