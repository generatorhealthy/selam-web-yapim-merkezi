-- Retry: remove duplicate unique constraints/indexes safely
DO $$
DECLARE
  name text;
BEGIN
  -- First drop constraints if they exist
  FOR name IN SELECT conname FROM pg_constraint c
               JOIN pg_class t ON c.conrelid = t.oid
               JOIN pg_namespace n ON n.oid = t.relnamespace
               WHERE n.nspname='public' AND t.relname='client_referrals'
                 AND conname IN (
                   'idx_client_referrals_unique',
                   'client_referrals_unique_per_month',
                   'ux_client_referrals_unique',
                   'client_referrals_unique',
                   'ux_client_referrals_spec_year_month',
                   'uniq_client_referrals_specialist_year_month'
                 )
  LOOP
    EXECUTE format('ALTER TABLE public.client_referrals DROP CONSTRAINT IF EXISTS %I', name);
  END LOOP;

  -- Then drop indexes (non-constraint ones) if they remain
  FOR name IN SELECT indexname FROM pg_indexes 
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
    EXECUTE format('DROP INDEX IF EXISTS public.%I', name);
  END LOOP;

  -- Ensure a single canonical unique index exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname='public' AND tablename='client_referrals' 
      AND indexname='client_referrals_specialist_id_year_month_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX client_referrals_specialist_id_year_month_key ON public.client_referrals (specialist_id, year, month)';
  END IF;
END $$;