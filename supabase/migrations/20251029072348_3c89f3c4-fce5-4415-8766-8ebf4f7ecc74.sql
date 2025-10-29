-- 1) Remove duplicates in client_referrals on (specialist_id, year, month)
WITH ranked AS (
  SELECT id,
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

-- 2) Create unique index to support ON CONFLICT in triggers/rpc
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'client_referrals_specialist_year_month_key'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX client_referrals_specialist_year_month_key ON public.client_referrals (specialist_id, year, month)';
  END IF;
END $$;

-- 3a) Remove duplicate appointments before creating unique index
WITH ranked_appts AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY specialist_id, appointment_date, appointment_time
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.appointments
)
DELETE FROM public.appointments a
USING ranked_appts r
WHERE a.id = r.id
AND r.rn > 1;

-- 3b) Now create unique index to prevent future double-booking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'appointments_specialist_datetime_key'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX appointments_specialist_datetime_key ON public.appointments (specialist_id, appointment_date, appointment_time)';
  END IF;
END $$;