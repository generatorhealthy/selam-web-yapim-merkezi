CREATE TABLE public.patient_contact_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, phone text NOT NULL,
 specialist_id uuid NOT NULL REFERENCES public.specialists(id), token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL, consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(phone,specialist_id)
);
GRANT ALL ON public.patient_contact_claims TO service_role;
ALTER TABLE public.patient_contact_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_service_only ON public.patient_contact_claims FOR ALL TO service_role USING(true) WITH CHECK(true);

CREATE OR REPLACE FUNCTION public.prepare_patient_contact(p_user_id uuid,p_specialist_id uuid,p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE phone_value text; claim_id uuid;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_required' USING ERRCODE='42501'; END IF;
 SELECT regexp_replace(phone,'[^0-9]','','g') INTO phone_value FROM auth.users
 WHERE id=p_user_id AND phone_confirmed_at IS NOT NULL;
 IF phone_value IS NULL OR phone_value !~ '^905[0-9]{9}$' OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$'
 OR NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=p_specialist_id AND is_active=true AND slug IS NOT NULL) THEN
  RAISE EXCEPTION 'verified_phone_and_specialist_required' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.patient_contact_claims(user_id,phone,specialist_id,token_hash,expires_at)
 VALUES(p_user_id,phone_value,p_specialist_id,p_token_hash,now()+interval '5 minutes')
 ON CONFLICT(phone,specialist_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at
 WHERE patient_contact_claims.consumed_at IS NULL AND patient_contact_claims.expires_at<now()
 RETURNING id INTO claim_id;
 IF claim_id IS NULL THEN RAISE EXCEPTION 'contact_already_requested' USING ERRCODE='23505'; END IF;
 RETURN jsonb_build_object('claim_id',claim_id);
END $$;
CREATE OR REPLACE FUNCTION public.consume_patient_contact(p_user_id uuid,p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.patient_contact_claims; s public.specialists;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'service_required' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.patient_contact_claims WHERE user_id=p_user_id AND token_hash=p_token_hash FOR UPDATE;
 IF c.id IS NULL OR c.consumed_at IS NOT NULL OR c.expires_at<=now()
 OR NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p_user_id AND u.phone_confirmed_at IS NOT NULL
 AND regexp_replace(u.phone,'[^0-9]','','g')=c.phone) THEN
  RAISE EXCEPTION 'contact_proof_invalid_or_used' USING ERRCODE='42501';
 END IF;
 SELECT * INTO s FROM public.specialists WHERE id=c.specialist_id AND is_active=true;
 IF s.id IS NULL OR s.slug IS NULL THEN RAISE EXCEPTION 'specialist_unavailable' USING ERRCODE='23514'; END IF;
 UPDATE public.patient_contact_claims SET consumed_at=now() WHERE id=c.id;
 RETURN jsonb_build_object('phone',c.phone,'name',s.name,'slug',s.slug,'specialty',s.specialty);
END $$;
REVOKE ALL ON FUNCTION public.prepare_patient_contact(uuid,uuid,text),public.consume_patient_contact(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_patient_contact(uuid,uuid,text),public.consume_patient_contact(uuid,text) TO service_role;