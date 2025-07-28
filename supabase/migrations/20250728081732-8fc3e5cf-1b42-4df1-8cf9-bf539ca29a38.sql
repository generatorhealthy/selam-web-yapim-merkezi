-- Fix client_referrals table RLS policies to allow staff access
-- Staff üyelerinin danışan yönlendirme verilerini görebilmesi için

DROP POLICY IF EXISTS "Client referrals policy" ON public.client_referrals;

-- Staff ve admin'lerin client_referrals tablosuna tam erişimi olacak
CREATE POLICY "Client referrals access policy" ON public.client_referrals
FOR ALL USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'staff'::user_role
    AND is_approved = true
  )
)
WITH CHECK (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'staff'::user_role
    AND is_approved = true
  )
);