ALTER TABLE public.ad_intel_settings
  ADD COLUMN IF NOT EXISTS min_roas_for_scale numeric NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS min_roas_for_keep numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS high_conf_min_paid integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_attribution_completeness numeric NOT NULL DEFAULT 60;

ALTER TABLE public.ai_ad_recommendations
  ADD COLUMN IF NOT EXISTS decision_reason_metrics text,
  ADD COLUMN IF NOT EXISTS confidence_factors jsonb;

DROP FUNCTION IF EXISTS public.get_ad_performance(date, date, text, text, text);
CREATE FUNCTION public.get_ad_performance(p_from date, p_to date, p_level text DEFAULT 'campaign', p_parent text DEFAULT NULL, p_model text DEFAULT 'last')
RETURNS TABLE(entity_id text, entity_name text, parent_id text, campaign_id text, spend numeric, impressions bigint, clicks bigint, link_clicks bigint, meta_leads bigint, active_days bigint,
  visits bigint, leads bigint, qualified bigint, qualified_paid bigint, registrations bigint, profiles bigint, checkouts bigint, paid bigint,
  gross_revenue numeric, refund_amount numeric, revenue numeric, thumbnail_url text, creative_id text)
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
  ), vis AS (
    SELECT CASE p_level WHEN 'ad' THEN e.meta_ad_id
      WHEN 'adset' THEN (SELECT max(d.adset_id) FROM meta_daily_metrics d WHERE d.ad_id=e.meta_ad_id)
      ELSE (SELECT max(d.campaign_id) FROM meta_daily_metrics d WHERE d.ad_id=e.meta_ad_id) END eid,
      count(DISTINCT e.anonymous_session_id)::bigint v
    FROM analytics_events e
    WHERE NOT e.is_test AND NULLIF(e.meta_ad_id,'') IS NOT NULL AND e.meta_ad_id <> '333333'
      AND (e.created_at AT TIME ZONE 'Europe/Istanbul')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ), touch AS (
    SELECT a.user_id, a.first_visit_at,
      CASE WHEN p_model='first' THEN a.first_touch
           ELSE CASE WHEN COALESCE(a.last_touch->>'meta_ad_id', a.last_touch->>'meta_campaign_id','') <> '' THEN a.last_touch ELSE a.first_touch END END t
    FROM lead_attribution a
    WHERE a.user_id IS NOT NULL AND NOT a.is_test AND a.first_visit_at::date BETWEEN p_from AND p_to
  ), u AS (
    SELECT DISTINCT ON (tc.user_id) tc.user_id, tc.first_visit_at,
      CASE p_level
        WHEN 'ad' THEN NULLIF(tc.t->>'meta_ad_id','')
        WHEN 'adset' THEN COALESCE((SELECT max(d.adset_id) FROM meta_daily_metrics d WHERE d.ad_id = tc.t->>'meta_ad_id'), NULLIF(tc.t->>'meta_adset_id',''))
        ELSE COALESCE((SELECT max(d.campaign_id) FROM meta_daily_metrics d WHERE d.ad_id = tc.t->>'meta_ad_id'), NULLIF(tc.t->>'meta_campaign_id','')) END eid
    FROM touch tc
    WHERE NULLIF(tc.t->>'meta_ad_id','') IS NOT NULL AND EXISTS(SELECT 1 FROM meta_daily_metrics md WHERE md.ad_id=tc.t->>'meta_ad_id')
    ORDER BY tc.user_id, CASE WHEN p_model='first' THEN tc.first_visit_at END ASC, tc.first_visit_at DESC
  ), li AS (
    SELECT l.user_id, l.score FROM get_lead_intelligence(v_days) l
  ), agg AS (
    SELECT u.eid,
      count(*) lds,
      count(*) FILTER (WHERE li.score >= v_thr) q,
      count(*) FILTER (WHERE li.score >= v_thr AND pay.net > 0) qp,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=u.user_id AND e.event_name='registration_completed')
                          OR EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=u.user_id)) regs,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=u.user_id)) prof,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=u.user_id AND e.event_name='checkout_started')) chk,
      count(*) FILTER (WHERE pay.net > 0) pd,
      COALESCE(sum(pay.gross),0) gross, COALESCE(sum(pay.refund),0) refund, COALESCE(sum(pay.net),0) net
    FROM u
    LEFT JOIN li ON li.user_id = u.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.user_id
    LEFT JOIN LATERAL (
      SELECT sum(o.amount) gross,
        sum(o.amount) FILTER (WHERE COALESCE(o.payment_status,'') IN ('refunded','iade')) refund,
        COALESCE(sum(o.amount),0) - COALESCE(sum(o.amount) FILTER (WHERE COALESCE(o.payment_status,'') IN ('refunded','iade')),0) net
      FROM orders o
      WHERE lower(o.customer_email)=lower(up.email) AND o.status IN ('approved','completed') AND o.deleted_at IS NULL
        AND COALESCE(o.payment_status,'') NOT IN ('failed','cancelled','canceled') AND o.amount>0
        AND COALESCE(o.approved_at,o.created_at)>=u.first_visit_at
    ) pay ON true
    WHERE u.eid IS NOT NULL GROUP BY u.eid
  )
  SELECT m.eid, m.ename, m.pid, m.cid, COALESCE(m.sp,0), m.imp, m.clk, m.lc, m.ml, m.ad_days,
    COALESCE(vis.v,0), COALESCE(agg.lds,0), COALESCE(agg.q,0), COALESCE(agg.qp,0), COALESCE(agg.regs,0), COALESCE(agg.prof,0), COALESCE(agg.chk,0),
    COALESCE(agg.pd,0), COALESCE(agg.gross,0), COALESCE(agg.refund,0), COALESCE(agg.net,0),
    (SELECT c.thumbnail_url FROM meta_ad_creatives c WHERE p_level='ad' AND c.ad_id=m.eid),
    (SELECT c.creative_id FROM meta_ad_creatives c WHERE p_level='ad' AND c.ad_id=m.eid)
  FROM m LEFT JOIN agg ON agg.eid = m.eid LEFT JOIN vis ON vis.eid = m.eid
  ORDER BY m.sp DESC NULLS LAST;
END $function$;
REVOKE ALL ON FUNCTION public.get_ad_performance(date,date,text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_performance(date,date,text,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_ad_attribution_completeness(p_from date, p_to date)
RETURNS TABLE(eligible_visits bigint, attributed_visits bigint, eligible_leads bigint, attributed_leads bigint,
  eligible_registrations bigint, attributed_registrations bigint, eligible_paid bigint, attributed_paid bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(auth.role(),'') <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  RETURN QUERY
  WITH v AS (
    SELECT e.anonymous_session_id s,
      bool_or(NULLIF(e.meta_ad_id,'') IS NOT NULL AND e.meta_ad_id <> '333333' AND EXISTS (SELECT 1 FROM meta_daily_metrics d WHERE d.ad_id=e.meta_ad_id)) att
    FROM analytics_events e
    WHERE NOT e.is_test AND e.event_name='landing_page_view' AND (e.created_at AT TIME ZONE 'Europe/Istanbul')::date BETWEEN p_from AND p_to
    GROUP BY 1
  ), l AS (
    SELECT a.user_id,
      (EXISTS (SELECT 1 FROM meta_daily_metrics d WHERE d.ad_id IN (a.last_touch->>'meta_ad_id', a.first_touch->>'meta_ad_id'))) att,
      (EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=a.user_id AND e.event_name='registration_completed') OR EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=a.user_id)) reg,
      EXISTS (SELECT 1 FROM orders o JOIN user_profiles up ON lower(up.email)=lower(o.customer_email)
        WHERE up.user_id=a.user_id AND o.status IN ('approved','completed') AND o.deleted_at IS NULL AND o.amount>0
          AND COALESCE(o.payment_status,'') NOT IN ('failed','cancelled','canceled','refunded','iade')
          AND COALESCE(o.approved_at,o.created_at)>=a.first_visit_at) pd
    FROM lead_attribution a
    WHERE a.user_id IS NOT NULL AND NOT a.is_test AND a.first_visit_at::date BETWEEN p_from AND p_to
  )
  SELECT (SELECT count(*) FROM v)::bigint, (SELECT count(*) FILTER (WHERE att) FROM v)::bigint,
    count(*)::bigint, count(*) FILTER (WHERE att)::bigint,
    count(*) FILTER (WHERE reg)::bigint, count(*) FILTER (WHERE reg AND att)::bigint,
    count(*) FILTER (WHERE pd)::bigint, count(*) FILTER (WHERE pd AND att)::bigint
  FROM l;
END $function$;
REVOKE ALL ON FUNCTION public.get_ad_attribution_completeness(date,date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_attribution_completeness(date,date) TO authenticated, service_role;