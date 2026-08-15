CREATE OR REPLACE FUNCTION public.resolve_specialist_slug(p_slug text)
RETURNS TABLE(slug text, specialty text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.slug, s.specialty
  FROM public.specialists s
  WHERE s.is_active = true
    AND (
      s.slug = p_slug
      OR s.slug ~ ('^' || regexp_replace(p_slug, '([^a-zA-Z0-9-])', '', 'g') || '-[0-9]+$')
    )
  ORDER BY (s.slug = p_slug) DESC, length(s.slug) ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_specialist_slug(text) TO anon, authenticated, service_role;