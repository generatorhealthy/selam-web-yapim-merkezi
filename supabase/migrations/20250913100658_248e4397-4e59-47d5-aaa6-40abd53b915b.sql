BEGIN;
-- Deduplicate client_referrals by (specialist_id, year, month)
CREATE TEMP TABLE cr_dedup AS
SELECT
  MIN(id) AS id,
  specialist_id, year, month,
  MAX(referral_count) AS referral_count,
  (MAX(CASE WHEN is_referred THEN 1 ELSE 0 END) = 1) AS is_referred,
  MAX(referred_at) AS referred_at,
  MAX(referred_by) AS referred_by,
  -- Keep the latest non-null notes
  COALESCE((ARRAY_REMOVE(ARRAY_AGG(notes ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST), NULL)) [1], NULL) AS notes,
  MAX(created_at) AS created_at,
  MAX(updated_at) AS updated_at
FROM public.client_referrals
GROUP BY specialist_id, year, month;

TRUNCATE TABLE public.client_referrals;

INSERT INTO public.client_referrals (
  id, specialist_id, year, month, referral_count, is_referred, referred_at, referred_by, notes, created_at, updated_at
)
SELECT
  id, specialist_id, year, month, referral_count, is_referred, referred_at, referred_by, notes,
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