-- Snapshot (temporary) context: only update Oct 2025 rows inferred from notes
-- Helper: extract first integer from a text
CREATE OR REPLACE FUNCTION public.extract_first_int(p_text text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  m text[];
  n integer := NULL;
BEGIN
  IF p_text IS NULL OR length(trim(p_text)) = 0 THEN
    RETURN NULL;
  END IF;
  -- capture first sequence of digits
  SELECT regexp_matches(p_text, '([0-9]+)') INTO m;
  IF m IS NOT NULL AND array_length(m,1) > 0 THEN
    BEGIN
      n := m[1]::integer;
    EXCEPTION WHEN others THEN
      n := NULL;
    END;
  END IF;
  RETURN n;
END;
$$;

-- Update only Oct 2025 client_referrals where count is 0 and notes contain a number
WITH inferred AS (
  SELECT id, extract_first_int(notes) AS inferred_count
  FROM public.client_referrals
  WHERE year = 2025 AND month = 10
    AND referral_count = 0
    AND notes IS NOT NULL
    AND notes ~ '[0-9]+'
)
UPDATE public.client_referrals cr
SET referral_count = GREATEST(0, inferred.inferred_count),
    is_referred = CASE WHEN inferred.inferred_count IS NOT NULL AND inferred.inferred_count > 0 THEN true ELSE is_referred END,
    referred_at = CASE WHEN inferred.inferred_count IS NOT NULL AND inferred.inferred_count > 0 AND cr.referred_at IS NULL THEN now() ELSE cr.referred_at END,
    updated_at = now()
FROM inferred
WHERE cr.id = inferred.id
  AND inferred.inferred_count IS NOT NULL;

-- Optional: keep function for future safe restores
COMMENT ON FUNCTION public.extract_first_int IS 'Returns the first integer found in a text (e.g., "2 kişi yönlendirildi" -> 2). Useful for restoring referral counts from notes.';