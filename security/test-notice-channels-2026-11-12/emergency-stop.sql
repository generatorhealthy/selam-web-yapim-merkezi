-- C0 ONLY: explicit approval required. Stop external health notices; preserve trigger/result writes.
BEGIN;
CREATE OR REPLACE FUNCTION public.notify_specialist_new_test_result() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN RETURN NEW; END $$;
COMMIT;