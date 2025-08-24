-- Phase 1: Critical Data Protection - Fix RLS Policies

-- 1. Secure appointments table - restrict to authorized users only
DROP POLICY IF EXISTS "Appointments simple policy" ON public.appointments;

CREATE POLICY "Specialists can view their appointments" 
ON public.appointments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.specialists 
    WHERE specialists.id = appointments.specialist_id 
    AND specialists.user_id = auth.uid()
  ) OR is_admin_user()
);

CREATE POLICY "Specialists can insert appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true); -- Allow public booking

CREATE POLICY "Specialists can update their appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.specialists 
    WHERE specialists.id = appointments.specialist_id 
    AND specialists.user_id = auth.uid()
  ) OR is_admin_user()
);

CREATE POLICY "Specialists can delete their appointments" 
ON public.appointments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.specialists 
    WHERE specialists.id = appointments.specialist_id 
    AND specialists.user_id = auth.uid()
  ) OR is_admin_user()
);

-- 2. Secure orders table - admin only access for sensitive operations
DROP POLICY IF EXISTS "Public select policy" ON public.orders;
DROP POLICY IF EXISTS "Admin update policy" ON public.orders;
DROP POLICY IF EXISTS "Admin delete policy" ON public.orders;

CREATE POLICY "Orders admin read policy" 
ON public.orders 
FOR SELECT 
USING (is_admin_user() OR is_admin_or_staff_user());

CREATE POLICY "Orders admin update policy" 
ON public.orders 
FOR UPDATE 
USING (is_admin_user() OR is_admin_or_staff_user())
WITH CHECK (is_admin_user() OR is_admin_or_staff_user());

CREATE POLICY "Orders admin delete policy" 
ON public.orders 
FOR DELETE 
USING (is_admin_user());

-- 3. Secure automatic_orders table - admin only
DROP POLICY IF EXISTS "Automatic orders policy" ON public.automatic_orders;

CREATE POLICY "Automatic orders admin policy" 
ON public.automatic_orders 
FOR ALL 
USING (is_admin_user() OR is_admin_or_staff_user())
WITH CHECK (is_admin_user() OR is_admin_or_staff_user());

-- 4. Hide specialist personal contact info from public
CREATE OR REPLACE VIEW public.specialists_public AS
SELECT 
  id,
  name,
  specialty,
  city,
  hospital,
  experience,
  consultation_fee,
  rating,
  reviews_count,
  working_hours_start,
  working_hours_end,
  is_active,
  online_consultation,
  face_to_face_consultation,
  profile_picture,
  bio,
  education,
  university,
  address,
  available_days,
  certifications,
  faq,
  seo_title,
  seo_description,
  seo_keywords,
  consultation_type,
  created_at,
  updated_at
FROM public.specialists
WHERE is_active = true;

-- 5. Secure test results - only authenticated users can insert
DROP POLICY IF EXISTS "Test results insert policy" ON public.test_results;

CREATE POLICY "Test results insert policy" 
ON public.test_results 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR is_admin_user());