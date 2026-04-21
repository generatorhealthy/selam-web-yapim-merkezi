DROP FUNCTION IF EXISTS public.get_public_specialist_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_public_specialist_by_slug(p_slug text)
 RETURNS TABLE(id uuid, name text, specialty text, bio text, profile_picture text, rating numeric, reviews_count integer, city text, consultation_fee numeric, consultation_type text, experience integer, education text, hospital text, university text, certifications text, online_consultation boolean, face_to_face_consultation boolean, address text, phone text, email text, working_hours_start text, working_hours_end text, available_days text[], available_time_slots jsonb, faq text, seo_title text, seo_description text, seo_keywords text, user_id uuid, slug text, interests text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id::uuid, s.name::text, s.specialty::text, s.bio::text, s.profile_picture::text,
    s.rating::numeric, s.reviews_count::integer, s.city::text, s.consultation_fee::numeric,
    s.consultation_type::text, s.experience::integer, s.education::text, s.hospital::text,
    s.university::text, s.certifications::text, s.online_consultation::boolean,
    s.face_to_face_consultation::boolean, s.address::text, s.phone::text, s.email::text,
    s.working_hours_start::text, s.working_hours_end::text, s.available_days::text[],
    s.available_time_slots::jsonb, s.faq::text, s.seo_title::text, s.seo_description::text,
    s.seo_keywords::text, s.user_id::uuid, s.slug::text, COALESCE(s.interests, '{}')::text[]
  FROM public.specialists s
  WHERE s.is_active = true AND s.slug = p_slug;
END;
$function$;