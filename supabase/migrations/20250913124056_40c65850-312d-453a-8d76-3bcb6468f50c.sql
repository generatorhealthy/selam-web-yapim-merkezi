-- Fix client_referrals upsert reliability
-- 1) Deduplicate rows keeping the latest per (specialist_id, year, month)
BEGIN;

WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY specialist_id, year, month 
      ORDER BY COALESCE(updated_at, created_at) DESC
    ) AS rn
  FROM public.client_referrals
)
DELETE FROM public.client_referrals cr
USING ranked r
WHERE cr.id = r.id
  AND r.rn > 1;

-- 2) Add unique constraint to support ON CONFLICT in RPCs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_referrals_unique'
  ) THEN
    ALTER TABLE public.client_referrals
    ADD CONSTRAINT client_referrals_unique UNIQUE (specialist_id, year, month);
  END IF;
END $$;

COMMIT;