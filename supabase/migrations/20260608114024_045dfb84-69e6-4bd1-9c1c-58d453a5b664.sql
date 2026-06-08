DROP POLICY IF EXISTS "Authenticated can view leads" ON public.danisan_basvurulari;
DROP POLICY IF EXISTS "Authenticated can insert leads" ON public.danisan_basvurulari;
DROP POLICY IF EXISTS "Authenticated can update leads" ON public.danisan_basvurulari;
DROP POLICY IF EXISTS "Authenticated can delete leads" ON public.danisan_basvurulari;

CREATE POLICY "Admin staff can view leads"
ON public.danisan_basvurulari FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true));

CREATE POLICY "Admin staff can insert leads"
ON public.danisan_basvurulari FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true));

CREATE POLICY "Admin staff can update leads"
ON public.danisan_basvurulari FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true));

CREATE POLICY "Admin staff can delete leads"
ON public.danisan_basvurulari FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true));