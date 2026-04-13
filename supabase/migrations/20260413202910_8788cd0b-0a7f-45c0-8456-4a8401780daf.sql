
-- Fix social_shares RLS policies: wrong column reference (user_profiles.id → user_profiles.user_id)
DROP POLICY IF EXISTS "Admin and staff can view all social shares" ON public.social_shares;
DROP POLICY IF EXISTS "Admin and staff can insert social shares" ON public.social_shares;
DROP POLICY IF EXISTS "Admin and staff can update social shares" ON public.social_shares;

CREATE POLICY "Admin and staff can view all social shares"
ON public.social_shares FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
  AND user_profiles.role IN ('admin', 'staff')
));

CREATE POLICY "Admin and staff can insert social shares"
ON public.social_shares FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
  AND user_profiles.role IN ('admin', 'staff')
));

CREATE POLICY "Admin and staff can update social shares"
ON public.social_shares FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
  AND user_profiles.role IN ('admin', 'staff')
));

-- Create secure view for reviews (hides reviewer_email from anonymous)
CREATE OR REPLACE VIEW public.public_reviews WITH (security_invoker = true) AS
SELECT 
  id,
  specialist_id,
  reviewer_name,
  rating,
  comment,
  status,
  created_at,
  updated_at
FROM public.reviews
WHERE status = 'approved';

-- Create secure view for specialists (hides PII from anonymous)
CREATE OR REPLACE VIEW public.public_specialists WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  specialty,
  bio,
  education,
  university,
  hospital,
  city,
  experience,
  profile_picture,
  rating,
  reviews_count,
  consultation_fee,
  consultation_type,
  online_consultation,
  face_to_face_consultation,
  available_days,
  available_time_slots,
  working_hours_start,
  working_hours_end,
  certifications,
  faq,
  is_active,
  seo_title,
  seo_description,
  seo_keywords,
  user_id,
  created_at,
  updated_at,
  registration_source
FROM public.specialists
WHERE is_active = true;
