
-- Drop and recreate view with slug
DROP VIEW IF EXISTS public.public_specialists;

CREATE VIEW public.public_specialists AS
SELECT 
  id,
  name,
  specialty,
  bio,
  profile_picture,
  rating,
  reviews_count,
  city,
  consultation_fee,
  consultation_type,
  experience,
  education,
  hospital,
  online_consultation,
  face_to_face_consultation,
  slug
FROM public.specialists
WHERE is_active = true;

-- Recreate function with slug
DROP FUNCTION IF EXISTS public.get_public_specialists();

CREATE OR REPLACE FUNCTION public.get_public_specialists()
RETURNS TABLE (
  id uuid,
  name text,
  specialty text,
  bio text,
  profile_picture text,
  rating numeric,
  reviews_count integer,
  city text,
  consultation_fee numeric,
  consultation_type text,
  experience integer,
  education text,
  hospital text,
  online_consultation boolean,
  face_to_face_consultation boolean,
  address_summary text,
  slug text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.specialty,
    s.bio,
    s.profile_picture,
    s.rating,
    s.reviews_count,
    s.city,
    s.consultation_fee,
    s.consultation_type,
    s.experience,
    s.education,
    s.hospital,
    s.online_consultation,
    s.face_to_face_consultation,
    CASE 
      WHEN s.address IS NOT NULL AND s.address != '' 
      THEN split_part(s.address, ',', 1)
      ELSE s.city
    END as address_summary,
    s.slug
  FROM public.specialists s
  WHERE s.is_active = true;
END;
$$;
