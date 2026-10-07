
-- 1) Test trafiğini otomatik işaretle
CREATE OR REPLACE FUNCTION public.track_lead_event(p_session_id text, p_event_name text, p_event_id text DEFAULT NULL::text, p_properties jsonb DEFAULT '{}'::jsonb, p_touch jsonb DEFAULT '{}'::jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_first jsonb; v_test boolean;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) > 100 THEN RETURN; END IF;
  IF p_event_name NOT IN ('landing_page_view','pricing_page_view','package_view','registration_started',
    'registration_step_completed','registration_completed','phone_verified','email_verified','profile_started',
    'profile_completed','dashboard_first_view','subscription_page_view','checkout_started','payment_attempted',
    'payment_failed','payment_completed','subscription_activated','subscription_cancelled','capacity_entered') THEN RETURN; END IF;
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

-- 2) Gerçek tahsilat: onaylı + başarısız/iade olmayan siparişler
CREATE OR REPLACE FUNCTION public.paid_revenue_by_email()
 RETURNS TABLE(em text, amt numeric, first_paid_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT lower(o.customer_email), sum(o.amount), min(COALESCE(o.approved_at, o.created_at))
  FROM orders o
  WHERE o.status IN ('approved','completed') AND o.deleted_at IS NULL
    AND COALESCE(o.payment_status,'') NOT IN ('failed','refunded','cancelled','canceled','iade')
    AND o.amount > 0
  GROUP BY 1
$$;
REVOKE ALL ON FUNCTION public.paid_revenue_by_email() FROM PUBLIC, anon, authenticated;

-- 3) Reklam performansı: atıf modeli seçilebilir (last = son ücretli temas, first = ilk temas)
DROP FUNCTION IF EXISTS public.get_ad_performance(date, date, text, text);
CREATE FUNCTION public.get_ad_performance(p_from date, p_to date, p_level text DEFAULT 'campaign', p_parent text DEFAULT NULL, p_model text DEFAULT 'last')
 RETURNS TABLE(entity_id text, entity_name text, parent_id text, campaign_id text, spend numeric, impressions bigint, clicks bigint, link_clicks bigint, meta_leads bigint, active_days bigint, leads bigint, qualified bigint, registrations bigint, profiles bigint, checkouts bigint, paid bigint, revenue numeric, thumbnail_url text, creative_id text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_thr int; v_days int := GREATEST((current_date - p_from) + 1, 1);
BEGIN
  IF COALESCE(auth.role(),'') <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  IF p_level NOT IN ('campaign','adset','ad') THEN RAISE EXCEPTION 'level'; END IF;
  IF p_model NOT IN ('first','last') THEN RAISE EXCEPTION 'model'; END IF;
  SELECT qualified_threshold INTO v_thr FROM ad_intel_settings WHERE id = 1;
  RETURN QUERY
  WITH m AS (
    SELECT CASE p_level WHEN 'campaign' THEN d.campaign_id WHEN 'adset' THEN d.adset_id ELSE d.ad_id END eid,
      max(CASE p_level WHEN 'campaign' THEN d.campaign_name WHEN 'adset' THEN d.adset_name ELSE d.ad_name END) ename,
      max(CASE p_level WHEN 'campaign' THEN NULL WHEN 'adset' THEN d.campaign_id ELSE d.adset_id END) pid,
      max(d.campaign_id) cid,
      sum(d.spend) sp, sum(d.impressions)::bigint imp, sum(d.clicks)::bigint clk, sum(COALESCE(d.link_clicks,0))::bigint lc,
      sum(d.meta_leads)::bigint ml, count(DISTINCT d.date) FILTER (WHERE d.spend > 0)::bigint ad_days
    FROM meta_daily_metrics d
    WHERE d.date BETWEEN p_from AND p_to
      AND (p_parent IS NULL OR (p_level='adset' AND d.campaign_id=p_parent) OR (p_level='ad' AND d.adset_id=p_parent))
    GROUP BY 1
  ), touch AS (
    -- reklam kimliği önce ad_id; set/kampanya seviyesi, eşleşen reklamın günlük verisinden türetilir
    SELECT a.user_id, a.first_visit_at,
      CASE WHEN p_model='first' THEN a.first_touch
           ELSE CASE WHEN COALESCE(a.last_touch->>'meta_ad_id', a.last_touch->>'meta_campaign_id','') <> '' THEN a.last_touch ELSE a.first_touch END END t
    FROM lead_attribution a
    WHERE a.user_id IS NOT NULL AND NOT a.is_test AND a.first_visit_at::date BETWEEN p_from AND p_to
  ), u AS (
    SELECT DISTINCT ON (tc.user_id) tc.user_id,
      CASE p_level
        WHEN 'ad' THEN NULLIF(tc.t->>'meta_ad_id','')
        WHEN 'adset' THEN COALESCE((SELECT max(d.adset_id) FROM meta_daily_metrics d WHERE d.ad_id = tc.t->>'meta_ad_id'), NULLIF(tc.t->>'meta_adset_id',''))
        ELSE COALESCE((SELECT max(d.campaign_id) FROM meta_daily_metrics d WHERE d.ad_id = tc.t->>'meta_ad_id'), NULLIF(tc.t->>'meta_campaign_id','')) END eid
    FROM touch tc
    ORDER BY tc.user_id, CASE WHEN p_model='first' THEN tc.first_visit_at END ASC, tc.first_visit_at DESC
  ), li AS (
    SELECT l.user_id, l.score, l.email FROM get_lead_intelligence(v_days) l
  ), pay AS (SELECT * FROM paid_revenue_by_email()),
  agg AS (
    SELECT u.eid,
      count(*) lds,
      count(*) FILTER (WHERE li.score >= v_thr OR pay.em IS NOT NULL) q,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=u.user_id AND e.event_name='registration_completed')
                          OR EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=u.user_id)) regs,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=u.user_id)) prof,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=u.user_id AND e.event_name='checkout_started')) chk,
      count(*) FILTER (WHERE pay.em IS NOT NULL) pd,
      COALESCE(sum(pay.amt),0) rev
    FROM u
    LEFT JOIN li ON li.user_id = u.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.user_id
    LEFT JOIN pay ON pay.em = lower(up.email)
    WHERE u.eid IS NOT NULL GROUP BY u.eid
  )
  SELECT m.eid, m.ename, m.pid, m.cid, COALESCE(m.sp,0), m.imp, m.clk, m.lc, m.ml, m.ad_days,
    COALESCE(agg.lds,0), COALESCE(agg.q,0), COALESCE(agg.regs,0), COALESCE(agg.prof,0), COALESCE(agg.chk,0),
    COALESCE(agg.pd,0), COALESCE(agg.rev,0),
    (SELECT c.thumbnail_url FROM meta_ad_creatives c WHERE p_level='ad' AND c.ad_id=m.eid),
    (SELECT c.creative_id FROM meta_ad_creatives c WHERE p_level='ad' AND c.ad_id=m.eid)
  FROM m LEFT JOIN agg ON agg.eid = m.eid
  ORDER BY m.sp DESC NULLS LAST;
END $function$;
REVOKE ALL ON FUNCTION public.get_ad_performance(date,date,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_performance(date,date,text,text,text) TO authenticated, service_role;

-- 4) Ayrıntılı Attribution Debugger
DROP FUNCTION IF EXISTS public.get_attribution_debug();
CREATE FUNCTION public.get_attribution_debug()
 RETURNS TABLE(session_id text, visit_at timestamptz, first_source text, last_source text, campaign_id text, adset_id text, ad_id text,
   campaign_name text, ad_name text, has_fbclid boolean, has_fbc boolean, has_fbp boolean, user_linked boolean,
   registered_at timestamptz, checkout_at timestamptz, paid_at timestamptz, paid_amount numeric, is_test boolean)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  RETURN QUERY
  WITH pay AS (SELECT * FROM paid_revenue_by_email())
  SELECT a.anonymous_session_id, a.last_visit_at,
    NULLIF(concat_ws(' / ', a.first_touch->>'utm_source', a.first_touch->>'utm_medium'),''),
    NULLIF(concat_ws(' / ', a.last_touch->>'utm_source', a.last_touch->>'utm_medium'),''),
    COALESCE(dm.campaign_id, a.last_touch->>'meta_campaign_id', a.first_touch->>'meta_campaign_id'),
    COALESCE(dm.adset_id, a.last_touch->>'meta_adset_id', a.first_touch->>'meta_adset_id'),
    COALESCE(a.last_touch->>'meta_ad_id', a.first_touch->>'meta_ad_id'),
    COALESCE(dm.campaign_name, a.last_touch->>'utm_campaign', a.first_touch->>'utm_campaign'),
    COALESCE(dm.ad_name, a.last_touch->>'utm_content', a.first_touch->>'utm_content'),
    (a.last_touch ? 'fbclid') OR (a.first_touch ? 'fbclid'),
    (a.last_touch ? 'fbc') OR (a.first_touch ? 'fbc'),
    (a.last_touch ? 'fbp') OR (a.first_touch ? 'fbp'),
    a.user_id IS NOT NULL,
    (SELECT min(e.created_at) FROM analytics_events e WHERE e.anonymous_session_id=a.anonymous_session_id AND e.event_name='registration_completed'),
    (SELECT min(e.created_at) FROM analytics_events e WHERE e.anonymous_session_id=a.anonymous_session_id AND e.event_name='checkout_started'),
    p.first_paid_at, p.amt, a.is_test
  FROM lead_attribution a
  LEFT JOIN LATERAL (SELECT d.campaign_id, d.adset_id, d.campaign_name, d.ad_name FROM meta_daily_metrics d
     WHERE d.ad_id = COALESCE(a.last_touch->>'meta_ad_id', a.first_touch->>'meta_ad_id') ORDER BY d.date DESC LIMIT 1) dm ON true
  LEFT JOIN user_profiles up ON up.user_id = a.user_id
  LEFT JOIN pay p ON p.em = lower(up.email)
  WHERE a.last_touch ?| ARRAY['meta_campaign_id','meta_adset_id','meta_ad_id','utm_source','fbclid']
     OR a.first_touch ?| ARRAY['meta_campaign_id','meta_adset_id','meta_ad_id','utm_source','fbclid']
  ORDER BY a.last_visit_at DESC LIMIT 50;
END $function$;
REVOKE ALL ON FUNCTION public.get_attribution_debug() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attribution_debug() TO authenticated;

-- 5) Test ziyareti: istenen test kimlikleri + kayıt/ödeme ekranı adımları (ödeme yok)
CREATE OR REPLACE FUNCTION public.create_test_ad_visit()
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_sid text := 'test_' || gen_random_uuid()::text;
  v_touch jsonb := jsonb_build_object('utm_source','meta','utm_medium','paid','utm_campaign','TEST_CAMPAIGN',
    'utm_content','TEST_AD','meta_campaign_id','111111','meta_adset_id','222222','meta_ad_id','333333',
    'landing_page','/kayit-ol','at', now());
  ev text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  INSERT INTO lead_attribution(anonymous_session_id, first_touch, last_touch, is_test) VALUES (v_sid, v_touch, v_touch, true);
  FOREACH ev IN ARRAY ARRAY['landing_page_view','registration_started','registration_completed','checkout_started'] LOOP
    INSERT INTO analytics_events(event_id, anonymous_session_id, event_name, event_properties, utm_source, utm_campaign,
      utm_content, meta_campaign_id, meta_adset_id, meta_ad_id, is_test)
    VALUES (gen_random_uuid()::text, v_sid, ev, '{"test":true}', 'meta', 'TEST_CAMPAIGN', 'TEST_AD', '111111', '222222', '333333', true);
  END LOOP;
  RETURN v_sid;
END $function$;
