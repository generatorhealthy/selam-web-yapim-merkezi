DROP POLICY IF EXISTS "Service role can insert whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Admin staff can insert whatsapp messages"
ON public.whatsapp_messages
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_staff_user());