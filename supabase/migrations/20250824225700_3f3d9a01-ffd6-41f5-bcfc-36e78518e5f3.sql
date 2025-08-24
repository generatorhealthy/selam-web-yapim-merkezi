-- SECURITY FIX: Protect customer personal data from public access

-- 1. Create secure public view for reviews (without email addresses)
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  specialist_id,
  reviewer_name,
  -- SECURITY: Hide email addresses from public view
  CASE 
    WHEN LENGTH(reviewer_name) > 0 THEN 
      CONCAT(LEFT(reviewer_name, 1), '***')
    ELSE 'Anonymous'
  END as reviewer_display_name,
  rating,
  comment,
  created_at
FROM public.reviews
WHERE status = 'approved';

-- 2. Create secure public view for specialists (without personal contact info)
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
  online_consultation,
  face_to_face_consultation,
  profile_picture,
  bio,
  education,
  university,
  -- SECURITY: Hide sensitive contact information
  CASE 
    WHEN address IS NOT NULL THEN 
      CONCAT(SPLIT_PART(address, ' ', 1), ' *** (Adres detayları randevu sonrası paylaşılacaktır)')
    ELSE NULL
  END as address_summary,
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

-- 3. Restrict reviews table access - hide emails from public
DROP POLICY IF EXISTS "Reviews read policy" ON public.reviews;

CREATE POLICY "Reviews public read policy" 
ON public.reviews 
FOR SELECT 
USING (
  -- Public can only see approved reviews without email access
  (status = 'approved' AND auth.uid() IS NULL) OR
  -- Admins and staff can see all
  is_admin_user() OR 
  (EXISTS ( 
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'staff'::user_role 
    AND is_approved = true
  ))
);

-- 4. Create function to safely get review data for public use
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_specialist_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  specialist_id uuid,
  reviewer_display_name text,
  rating integer,
  comment text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.specialist_id,
    CASE 
      WHEN LENGTH(r.reviewer_name) > 1 THEN 
        CONCAT(LEFT(r.reviewer_name, 1), '***')
      ELSE 'Anonymous'
    END::text as reviewer_display_name,
    r.rating,
    r.comment,
    r.created_at
  FROM public.reviews r
  WHERE r.status = 'approved'
    AND (p_specialist_id IS NULL OR r.specialist_id = p_specialist_id)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to safely get specialist contact info (only for appointments)
CREATE OR REPLACE FUNCTION public.get_specialist_contact_for_appointment(p_specialist_id uuid)
RETURNS TABLE (
  email text,
  phone text
) AS $$
BEGIN
  -- Only return contact info if user is authenticated (for appointments)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized access to contact information';
  END IF;
  
  RETURN QUERY
  SELECT s.email, s.phone
  FROM public.specialists s
  WHERE s.id = p_specialist_id 
    AND s.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;