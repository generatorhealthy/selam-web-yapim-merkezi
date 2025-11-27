-- Drop the unique constraint that prevents multiple client referrals per specialist per month
DROP INDEX IF EXISTS public.client_referrals_specialist_year_month_key;