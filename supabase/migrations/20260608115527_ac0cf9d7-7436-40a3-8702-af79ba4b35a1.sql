-- 1) Safe basic info RPC for public/patient contexts (NO email/phone/private fields)
CREATE OR REPLACE FUNCTION public.get_specialist_basic_info()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  specialty text,
  profile_picture text,
  city text,
  bio text,
  rating numeric,
  reviews_count integer,
  experience integer,
  online_consultation boolean,
  face_to_face_consultation boolean,
  slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.user_id, s.name, s.specialty, s.profile_picture, s.city, s.bio,
    s.rating, s.reviews_count, s.experience, s.online_consultation,
    s.face_to_face_consultation, s.slug
  FROM public.specialists s
  WHERE s.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_specialist_basic_info() TO anon, authenticated;

-- 2) Keep public slug RPC signature, but return NULL for phone/email (no leak, no breakage)
CREATE OR REPLACE FUNCTION public.get_public_specialist_by_slug(p_slug text)
RETURNS TABLE (
  id uuid, name text, specialty text, bio text, profile_picture text,
  rating numeric, reviews_count integer, city text, consultation_fee numeric,
  consultation_type text, experience integer, education text, hospital text,
  university text, certifications text, online_consultation boolean,
  face_to_face_consultation boolean, address text, phone text, email text,
  working_hours_start text, working_hours_end text, available_days text[],
  available_time_slots jsonb, faq text, seo_title text, seo_description text,
  seo_keywords text, user_id uuid, slug text, interests text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.name, s.specialty, s.bio, s.profile_picture,
    s.rating, s.reviews_count, s.city, s.consultation_fee,
    s.consultation_type, s.experience, s.education, s.hospital,
    s.university, s.certifications, s.online_consultation,
    s.face_to_face_consultation, s.address,
    NULL::text AS phone, NULL::text AS email,
    s.working_hours_start, s.working_hours_end, s.available_days,
    s.available_time_slots, s.faq, s.seo_title, s.seo_description,
    s.seo_keywords, s.user_id, s.slug, s.interests
  FROM public.specialists s
  WHERE s.slug = p_slug AND s.is_active = true
  LIMIT 1;
$$;

-- 3) Restrict direct SELECT on specialists base table to owner + admin/staff only
DROP POLICY IF EXISTS "Authenticated can view specialists" ON public.specialists;
DROP POLICY IF EXISTS "Authenticated view own specialist" ON public.specialists;

CREATE POLICY "Owner or admin staff can view specialists"
ON public.specialists
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin_or_staff_user()
);