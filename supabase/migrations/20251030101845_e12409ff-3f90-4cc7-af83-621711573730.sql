
-- Rollback the previous migration's duplicate deletion by restoring lost referral counts
-- This migration will not restore the deleted rows, but will attempt to fix counts if we have audit data

-- Since we cannot restore deleted data without a backup, we'll document this issue
-- and add a comment for manual intervention if needed

COMMENT ON TABLE public.client_referrals IS 'Migration 20251029072348 removed duplicate records but did not sum referral_counts. Manual data restoration may be needed from backups if counts were lost.';

-- Create a function to prevent future data loss when handling duplicates
CREATE OR REPLACE FUNCTION public.merge_duplicate_client_referrals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function can be called before removing duplicates to sum counts
  -- It creates a temporary table with summed counts
  CREATE TEMP TABLE IF NOT EXISTS temp_merged_referrals AS
  SELECT 
    specialist_id,
    year,
    month,
    SUM(referral_count) as total_count,
    MAX(updated_at) as latest_update,
    MAX(created_at) as latest_create,
    MAX(id) as keep_id
  FROM public.client_referrals
  GROUP BY specialist_id, year, month
  HAVING COUNT(*) > 1;
  
  -- Update the kept records with summed counts
  UPDATE public.client_referrals cr
  SET referral_count = tmr.total_count,
      updated_at = NOW()
  FROM temp_merged_referrals tmr
  WHERE cr.id = tmr.keep_id;
  
  DROP TABLE IF EXISTS temp_merged_referrals;
END;
$$;

-- Add a note to the admin_upsert_client_referral function documentation
COMMENT ON FUNCTION public.admin_upsert_client_referral IS 'Upserts client referral data. Uses ON CONFLICT to handle duplicates safely by updating existing records rather than creating duplicates.';
