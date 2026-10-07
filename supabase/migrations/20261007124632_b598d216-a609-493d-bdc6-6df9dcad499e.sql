CREATE OR REPLACE FUNCTION public.track_lead_event(p_session_id text, p_event_name text, p_event_id text DEFAULT NULL::text, p_properties jsonb DEFAULT '{}'::jsonb, p_touch jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_first jsonb; v_test boolean;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) > 100 THEN RETURN; END IF;
  IF p_event_name NOT IN ('landing_page_view','pricing_page_view','package_view','registration_started',
    'registration_step_completed','registration_completed','phone_verified','email_verified','profile_started',
    'profile_completed','dashboard_first_view','subscription_page_view','checkout_started','payment_attempted',
    'payment_failed','payment_completed','subscription_activated','subscription_cancelled','capacity_entered',
    'registration_form_view','first_field_focus','email_entered','phone_entered','step_1_submit_attempt',
    'validation_error','step_2_view') THEN RETURN; END IF;
  IF length(p_properties::text) > 4000 OR length(p_touch::text) > 4000 THEN RETURN; END IF;

  v_test := COALESCE(
    (p_touch->'first'->>'utm_campaign') ILIKE 'TEST\_%' OR (p_touch->'last'->>'utm_campaign') ILIKE 'TEST\_%'
    OR (p_touch->'first'->>'meta_ad_id') = '333333' OR (p_touch->'last'->>'meta_ad_id') = '333333', false);

  INSERT INTO lead_attribution(anonymous_session_id, user_id, first_touch, last_touch, is_test)
  VALUES (p_session_id, v_uid, COALESCE(p_touch->'first','{}'), COALESCE(p_touch->'last','{}'), v_test)
  ON CONFLICT (anonymous_session_id) DO UPDATE
    SET last_touch = CASE WHEN EXCLUDED.last_touch <> '{}'::jsonb THEN EXCLUDED.last_touch ELSE lead_attribution.last_touch END,
        user_id = COALESCE(lead_attribution.user_id, EXCLUDED.user_id),
        is_test = lead_attribution.is_test OR EXCLUDED.is_test,
        last_visit_at = now()
  RETURNING first_touch, is_test INTO v_first, v_test;

  INSERT INTO analytics_events(event_id, user_id, anonymous_session_id, event_name, event_properties,
    utm_source, utm_campaign, utm_content, meta_campaign_id, meta_adset_id, meta_ad_id, fbc, fbp, is_test)
  VALUES (p_event_id, v_uid, p_session_id, p_event_name, COALESCE(p_properties,'{}'),
    v_first->>'utm_source', v_first->>'utm_campaign', v_first->>'utm_content',
    v_first->>'meta_campaign_id', v_first->>'meta_adset_id', v_first->>'meta_ad_id',
    p_touch->'last'->>'fbc', p_touch->'last'->>'fbp', v_test);

  IF v_uid IS NOT NULL THEN
    UPDATE analytics_events SET user_id = v_uid WHERE anonymous_session_id = p_session_id AND user_id IS NULL;
  END IF;
EXCEPTION WHEN unique_violation THEN RETURN;
END $function$;