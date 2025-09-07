-- 1) Deduplicate client_referrals keeping the most recently updated per (specialist_id, year, month)
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY specialist_id, year, month 
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.client_referrals
)
DELETE FROM public.client_referrals cr
USING ranked r
WHERE cr.id = r.id
  AND r.rn > 1;

-- 2) Add a unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_referrals_unique
  ON public.client_referrals (specialist_id, year, month);