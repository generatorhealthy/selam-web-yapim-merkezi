-- 1) Deduplicate client_referrals by (specialist_id, year, month) keeping latest by updated_at/created_at
WITH ranked AS (
  SELECT 
    id,
    specialist_id,
    year,
    month,
    ROW_NUMBER() OVER (
      PARTITION BY specialist_id, year, month 
      ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC
    ) AS rn
  FROM public.client_referrals
)
DELETE FROM public.client_referrals c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- 2) Ensure unique constraint for (specialist_id, year, month)
CREATE UNIQUE INDEX IF NOT EXISTS ux_client_referrals_spec_year_month
ON public.client_referrals (specialist_id, year, month);

-- 3) Ensure updated_at gets maintained automatically on UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_update_client_referrals_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_client_referrals_updated_at
    BEFORE UPDATE ON public.client_referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;