-- Clean up duplicate unique indexes on client_referrals to avoid ambiguous conflict targets
DO $$
DECLARE
  idx text;
BEGIN
  -- Keep a single canonical unique index and drop others if they exist
  -- We'll keep: client_referrals_specialist_id_year_month_key
  FOR idx IN SELECT indexname FROM pg_indexes 
             WHERE schemaname='public' AND tablename='client_referrals'
               AND indexname IN (
                 'idx_client_referrals_unique',
                 'client_referrals_unique_per_month',
                 'ux_client_referrals_unique',
                 'client_referrals_unique',
                 'ux_client_referrals_spec_year_month',
                 'uniq_client_referrals_specialist_year_month'
               )
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', idx);
  END LOOP;

  -- Ensure the kept unique index exists; if missing, (re)create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='client_referrals' 
      AND indexname='client_referrals_specialist_id_year_month_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX client_referrals_specialist_id_year_month_key ON public.client_referrals (specialist_id, year, month)';
  END IF;
END $$;
