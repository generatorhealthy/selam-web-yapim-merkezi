-- Deduplicate client_referrals keeping the most recently updated row per (specialist_id, year, month)
WITH ranked AS (
  SELECT 
    id,
    specialist_id,
    year,
    month,
    updated_at,
    created_at,
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

-- Add a unique index to enforce one row per specialist/year/month
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'ux_client_referrals_unique'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX ux_client_referrals_unique
      ON public.client_referrals (specialist_id, year, month);
  END IF;
END $$;

-- Backfill missing rows for the current year (months 1..12) for all active specialists
INSERT INTO public.client_referrals (specialist_id, year, month, referral_count, is_referred, created_at, updated_at)
SELECT 
  s.id AS specialist_id,
  EXTRACT(YEAR FROM now())::int AS year,
  m.month,
  0 AS referral_count,
  false AS is_referred,
  now(),
  now()
FROM public.specialists s
CROSS JOIN (SELECT generate_series(1,12) AS month) m
WHERE s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.client_referrals cr
    WHERE cr.specialist_id = s.id
      AND cr.year = EXTRACT(YEAR FROM now())::int
      AND cr.month = m.month
  );