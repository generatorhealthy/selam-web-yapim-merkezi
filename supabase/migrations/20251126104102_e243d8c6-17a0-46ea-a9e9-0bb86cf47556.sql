-- Drop the old RPC function that uses the old unique constraint logic
DROP FUNCTION IF EXISTS public.admin_upsert_client_referral(uuid, integer, integer, integer, uuid);

-- Drop the old unique constraint index if it still exists
DROP INDEX IF EXISTS public.uniq_client_referrals_specialist_year_month;