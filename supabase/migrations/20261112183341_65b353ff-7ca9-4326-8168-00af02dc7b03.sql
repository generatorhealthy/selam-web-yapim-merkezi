CREATE TABLE public.test_email_delivery_claims (
 result_id uuid PRIMARY KEY,
 status text NOT NULL DEFAULT 'sending' CHECK(status IN ('sending','sent','failed','unknown')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.test_email_delivery_claims TO service_role;
ALTER TABLE public.test_email_delivery_claims ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_test_email_delivery(p_result uuid,p_user uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE claimed uuid;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.test_results r JOIN public.specialists s ON s.id=r.specialist_id
 JOIN public.tests t ON t.id=r.test_id
 WHERE r.id=p_result AND s.user_id=p_user AND s.is_active AND t.is_active
 AND r.created_at >= '2026-11-12T18:29:00Z'::timestamptz
 AND (t.specialist_id=s.id OR EXISTS(SELECT 1 FROM public.specialist_tests st
 WHERE st.test_id=t.id AND st.specialist_id=s.id AND st.is_enabled))) THEN
  RAISE EXCEPTION 'notice forbidden' USING ERRCODE='42501'; END IF;
 INSERT INTO public.test_email_delivery_claims(result_id) VALUES(p_result)
 ON CONFLICT DO NOTHING RETURNING result_id INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.claim_test_email_delivery(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_test_email_delivery(uuid,uuid) TO service_role;