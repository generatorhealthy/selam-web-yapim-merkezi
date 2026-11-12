-- Isolated candidate: quotas disabled until staging operator sets reviewed values.
CREATE TABLE public.test_prepare_limits(id boolean PRIMARY KEY DEFAULT true,max_requests integer NOT NULL,window_seconds integer NOT NULL);
GRANT ALL ON public.test_prepare_limits TO service_role;
ALTER TABLE public.test_prepare_limits ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_prepare_budgets(key text NOT NULL,bucket bigint NOT NULL,used integer NOT NULL DEFAULT 0,PRIMARY KEY(key,bucket));
GRANT ALL ON public.test_prepare_budgets TO service_role;
ALTER TABLE public.test_prepare_budgets ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.test_prepare_proofs(hash text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.test_prepare_proofs TO service_role;
ALTER TABLE public.test_prepare_proofs ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_test_prepare_budget(p_key text,p_proof text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE cfg public.test_prepare_limits; used_count integer; b bigint;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server only' USING ERRCODE='42501'; END IF;
 SELECT * INTO cfg FROM public.test_prepare_limits WHERE id FOR SHARE;
 IF NOT FOUND OR cfg.max_requests<1 OR cfg.window_seconds<1 OR p_key !~ '^[a-f0-9]{64}$' OR p_proof !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
 INSERT INTO public.test_prepare_proofs(hash) VALUES(p_proof) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN false; END IF;
 b:=floor(extract(epoch FROM now())/cfg.window_seconds);
 INSERT INTO public.test_prepare_budgets(key,bucket,used) VALUES(p_key,b,1)
 ON CONFLICT(key,bucket) DO UPDATE SET used=test_prepare_budgets.used+1 WHERE test_prepare_budgets.used<cfg.max_requests RETURNING used INTO used_count;
 RETURN used_count IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.consume_test_prepare_budget(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_test_prepare_budget(text,text) TO service_role;