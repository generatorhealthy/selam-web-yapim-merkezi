-- Remove the unique constraint that prevents multiple client referrals per month
-- This allows multiple clients to be referred to the same specialist in the same month
DROP INDEX IF EXISTS public.uniq_client_referrals_specialist_year_month;

-- Create a new unique index that includes client information to allow multiple clients
-- This ensures we don't duplicate the exact same client referral
CREATE UNIQUE INDEX IF NOT EXISTS uniq_client_referral_specialist_month_client
ON public.client_referrals (specialist_id, year, month, client_name, client_surname)
WHERE client_name IS NOT NULL AND client_surname IS NOT NULL;