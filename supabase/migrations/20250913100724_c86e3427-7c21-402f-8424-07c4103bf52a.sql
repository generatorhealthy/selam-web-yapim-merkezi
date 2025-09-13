BEGIN;
-- Deduplicate client_referrals by (specialist_id, year, month)
-- Keep highest referral_count and latest notes for each specialist/month/year

-- Create temp table with deduplicated data
CREATE TEMP TABLE cr_dedup AS
SELECT DISTINCT ON (specialist_id, year, month)
  specialist_id, year, month,
  referral_count,
  is_referred,
  referred_at,
  referred_by,
  notes,
  created_at,
  updated_at
FROM (
  SELECT 
    specialist_id, year, month,
    -- Get the maximum referral_count for this combination
    MAX(referral_count) OVER (PARTITION BY specialist_id, year, month) as max_count,
    referral_count,
    is_referred,
    referred_at,
    referred_by,
    notes,
    created_at,
    updated_at,
    -- Order by updated_at DESC to get latest record for tie-breaking
    ROW_NUMBER() OVER (PARTITION BY specialist_id, year, month ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) as rn
  FROM public.client_referrals
) ranked
WHERE rn = 1 AND referral_count = max_count
ORDER BY specialist_id, year, month;

-- Clear existing data
TRUNCATE TABLE public.client_referrals;

-- Insert deduplicated data with new UUIDs
INSERT INTO public.client_referrals (
  specialist_id, year, month, referral_count, is_referred, referred_at, referred_by, notes, created_at, updated_at
)
SELECT
  specialist_id, year, month, referral_count, is_referred, referred_at, referred_by, notes,
  COALESCE(created_at, now()), COALESCE(updated_at, now())
FROM cr_dedup;

DROP TABLE cr_dedup;

-- Add unique constraint to enforce single row per specialist/month/year
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_referrals_unique_per_month'
  ) THEN
    ALTER TABLE public.client_referrals
      ADD CONSTRAINT client_referrals_unique_per_month UNIQUE (specialist_id, year, month);
  END IF;
END $$;
COMMIT;