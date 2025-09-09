-- Deduplicate client_referrals by (specialist_id, year, month) keeping the most recent row
WITH ranked AS (
  SELECT 
    id,
    specialist_id,
    year,
    month,
    COALESCE(updated_at, created_at) AS ts,
    ROW_NUMBER() OVER (
      PARTITION BY specialist_id, year, month 
      ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC
    ) AS rn
  FROM public.client_referrals
)
DELETE FROM public.client_referrals c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- Ensure uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_referrals_unique
ON public.client_referrals (specialist_id, year, month);
