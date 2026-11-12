-- Minimal test fixture: no HTTP or provider transport; not the live appointment schema.
CREATE FUNCTION public.fixture_create_appointment(p_id uuid,p_specialist uuid,p_user uuid,p_health boolean,p_notes text,p_topic text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'server required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.specialists WHERE id=p_specialist AND is_active) THEN RAISE EXCEPTION 'specialist unavailable'; END IF;
 IF p_health THEN
  PERFORM 1 FROM public.verified_consent_current WHERE user_id=p_user AND purpose='health_appointment' AND action='grant' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'scoped consent required'; END IF;
 END IF;
 INSERT INTO public.appointments(id,specialist_id,patient_user_id,notes,consultation_topic)
 VALUES(p_id,p_specialist,p_user,CASE WHEN p_health THEN p_notes END,CASE WHEN p_health THEN p_topic END);
 INSERT INTO public.simulated_deliveries(event_key,channel) VALUES(p_id::text,'appointment');
 RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION public.fixture_create_appointment(uuid,uuid,uuid,boolean,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fixture_create_appointment(uuid,uuid,uuid,boolean,text,text) TO service_role;