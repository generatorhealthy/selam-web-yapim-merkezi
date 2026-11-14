CREATE TABLE public.lead_session_authority (session_id text PRIMARY KEY, token_hash text NOT NULL, expires_at timestamptz NOT NULL);
GRANT ALL ON public.lead_session_authority TO service_role;
ALTER TABLE public.lead_session_authority ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_authority_service_only ON public.lead_session_authority FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE FUNCTION public.track_verified_lead_event(p_session_id text,p_token text,p_uid uuid,p_event_name text,p_event_id text,p_properties jsonb DEFAULT '{}',p_touch jsonb DEFAULT '{}') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_first jsonb; v_test boolean;
BEGIN
IF NOT EXISTS(SELECT 1 FROM public.lead_session_authority WHERE session_id=p_session_id AND token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND expires_at>now()) THEN RAISE EXCEPTION 'lead_session_unauthorized' USING ERRCODE='42501'; END IF;
IF p_event_name NOT IN ('landing_page_view','pricing_page_view','package_view','registration_started','registration_step_completed','registration_completed','phone_verified','email_verified','profile_started','profile_completed','dashboard_first_view','subscription_page_view','checkout_started','payment_attempted','payment_failed','payment_completed','subscription_activated','subscription_cancelled','capacity_entered','registration_form_view','first_field_focus','email_entered','phone_entered','step_1_submit_attempt','validation_error','step_2_view') THEN RETURN; END IF;
IF length(p_properties::text)>4000 OR length(p_touch::text)>4000 OR length(p_event_id)>100 THEN RETURN; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('lead:'||p_session_id,0));
IF EXISTS(SELECT 1 FROM lead_attribution WHERE anonymous_session_id=p_session_id AND user_id IS NOT NULL AND user_id IS DISTINCT FROM p_uid) THEN RAISE EXCEPTION 'lead_owner_mismatch' USING ERRCODE='42501'; END IF;
v_test:=coalesce((p_touch->'first'->>'utm_campaign') ILIKE 'TEST\_%' OR (p_touch->'last'->>'utm_campaign') ILIKE 'TEST\_%' OR (p_touch->'first'->>'meta_ad_id')='333333' OR (p_touch->'last'->>'meta_ad_id')='333333',false);
INSERT INTO lead_attribution(anonymous_session_id,user_id,first_touch,last_touch,is_test) VALUES(p_session_id,p_uid,coalesce(p_touch->'first','{}'),coalesce(p_touch->'last','{}'),v_test)
ON CONFLICT(anonymous_session_id) DO UPDATE SET last_touch=CASE WHEN EXCLUDED.last_touch<>'{}'::jsonb THEN EXCLUDED.last_touch ELSE lead_attribution.last_touch END,user_id=coalesce(lead_attribution.user_id,EXCLUDED.user_id),is_test=lead_attribution.is_test OR EXCLUDED.is_test,last_visit_at=now() RETURNING first_touch,is_test INTO v_first,v_test;
INSERT INTO analytics_events(event_id,user_id,anonymous_session_id,event_name,event_properties,utm_source,utm_campaign,utm_content,meta_campaign_id,meta_adset_id,meta_ad_id,fbc,fbp,is_test)
VALUES(p_event_id,p_uid,p_session_id,p_event_name,coalesce(p_properties,'{}'),v_first->>'utm_source',v_first->>'utm_campaign',v_first->>'utm_content',v_first->>'meta_campaign_id',v_first->>'meta_adset_id',v_first->>'meta_ad_id',p_touch->'last'->>'fbc',p_touch->'last'->>'fbp',v_test);
IF p_uid IS NOT NULL THEN UPDATE analytics_events SET user_id=p_uid WHERE anonymous_session_id=p_session_id AND user_id IS NULL; END IF;
EXCEPTION WHEN unique_violation THEN RETURN;
END $$;
REVOKE ALL ON FUNCTION public.track_verified_lead_event(text,text,uuid,text,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.track_verified_lead_event(text,text,uuid,text,text,jsonb,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.track_lead_event(p_session_id text,p_event_name text,p_event_id text DEFAULT NULL,p_properties jsonb DEFAULT '{}',p_touch jsonb DEFAULT '{}') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN; END $$;
REVOKE ALL ON FUNCTION public.track_lead_event(text,text,text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;