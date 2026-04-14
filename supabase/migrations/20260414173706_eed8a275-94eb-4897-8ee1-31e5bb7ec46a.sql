
-- Drop the old overloaded function (with p_limit and p_specialist_id, returning reviewer_name)
DROP FUNCTION IF EXISTS public.get_public_reviews(integer, uuid);

-- Drop the newer one too, we'll recreate a single clean version
DROP FUNCTION IF EXISTS public.get_public_reviews(uuid);

-- Create single unified function with both parameters
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_limit integer DEFAULT 10, p_specialist_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid, 
  specialist_id uuid, 
  reviewer_display_name text, 
  reviewer_name text,
  rating integer, 
  comment text, 
  status text, 
  created_at timestamp with time zone, 
  specialist_name text, 
  specialist_specialty text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id,
    r.specialist_id,
    CASE 
      WHEN r.reviewer_name IS NOT NULL AND length(r.reviewer_name) > 2 
      THEN left(r.reviewer_name, 1) || repeat('*', greatest(length(r.reviewer_name) - 2, 1)) || right(r.reviewer_name, 1)
      ELSE 'Anonim'
    END as reviewer_display_name,
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
