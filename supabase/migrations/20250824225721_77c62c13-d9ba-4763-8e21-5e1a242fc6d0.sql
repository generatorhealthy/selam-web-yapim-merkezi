-- Fix security definer issues and function search paths

-- Drop problematic views and recreate as regular views  
DROP VIEW IF EXISTS public.reviews_public;
DROP VIEW IF EXISTS public.specialists_public;

-- Fix functions with proper search paths
DROP FUNCTION IF EXISTS public.get_public_reviews(uuid);
DROP FUNCTION IF EXISTS public.get_specialist_contact_for_appointment(uuid);

-- Create function to safely get review data (without SECURITY DEFINER view)
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_specialist_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  specialist_id uuid,
  reviewer_display_name text,
  rating integer,
  comment text,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create function to safely get specialist public data
CREATE OR REPLACE FUNCTION public.get_public_specialists()
RETURNS TABLE (
  id uuid,
  name text,
  specialty text,
  city text,
  hospital text,
  experience integer,
  consultation_fee integer,
  rating numeric,
  reviews_count integer,
  working_hours_start time,
  working_hours_end time,
  online_consultation boolean,
  face_to_face_consultation boolean,
  profile_picture text,
  bio text,
  education text,
  university text,
  address_summary text,
  available_days text[],
  certifications text,
  faq text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  consultation_type text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.specialty,
    s.city,
    s.hospital,
    s.experience,
    s.consultation_fee,
    s.rating,
    s.reviews_count,
    s.working_hours_start,
    s.working_hours_end,
    s.online_consultation,
    s.face_to_face_consultation,
    s.profile_picture,
    s.bio,
    s.education,
    s.university,
    -- SECURITY: Hide sensitive contact information
    CASE 
      WHEN s.address IS NOT NULL THEN 
        CONCAT(SPLIT_PART(s.address, ' ', 1), ' *** (Detaylar randevu sonrası paylaşılacaktır)')
      ELSE NULL
    END::text as address_summary,
    s.available_days,
    s.certifications,
    s.faq,
    s.seo_title,
    s.seo_description,
    s.seo_keywords,
    s.consultation_type,
    s.created_at,
    s.updated_at
  FROM public.specialists s
  WHERE s.is_active = true;
END;
$$;