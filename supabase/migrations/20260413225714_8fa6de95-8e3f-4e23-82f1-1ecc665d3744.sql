CREATE OR REPLACE FUNCTION public.get_public_specialists()
RETURNS TABLE(
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
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id::uuid,
    s.name::text,
    s.specialty::text,
    s.bio::text,
    s.profile_picture::text,
    s.rating::numeric,
    s.reviews_count::integer,
    s.city::text,
    s.consultation_fee::numeric,
    s.consultation_type::text,
    s.experience::integer,
    s.education::text,
    s.hospital::text,
    s.online_consultation::boolean,
    s.face_to_face_consultation::boolean,
    (
      CASE 
        WHEN s.address IS NOT NULL AND s.address != '' THEN split_part(s.address, ',', 1)
        ELSE s.city
      END
    )::text AS address_summary,
    s.slug::text
  FROM public.specialists s
  WHERE s.is_active = true;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_specialists() TO anon, authenticated;