
-- Create a secure function to get public reviews without email
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_limit integer DEFAULT 10, p_specialist_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  specialist_id uuid,
  reviewer_name text,
  rating integer,
  comment text,
  status text,
  created_at timestamptz,
  specialist_name text,
  specialist_specialty text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.specialist_id,
    r.reviewer_name,
    r.rating,
    r.comment,
    r.status,
    r.created_at,
    s.name as specialist_name,
    s.specialty as specialist_specialty
  FROM public.reviews r
  LEFT JOIN public.specialists s ON s.id = r.specialist_id
  WHERE r.status = 'approved'
  AND (p_specialist_id IS NULL OR r.specialist_id = p_specialist_id)
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;
