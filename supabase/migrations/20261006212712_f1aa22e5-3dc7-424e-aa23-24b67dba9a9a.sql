-- Ayarlar (tek satır)
CREATE TABLE public.ad_intel_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ad_account_id text,
  ad_account_name text,
  qualified_threshold integer NOT NULL DEFAULT 60,
  min_leads_for_decision integer NOT NULL DEFAULT 10,
  min_purchases_for_scale integer NOT NULL DEFAULT 3,
  min_spend_for_pause numeric NOT NULL DEFAULT 1000,
  min_days_active integer NOT NULL DEFAULT 3,
  target_cac numeric NOT NULL DEFAULT 1000,
  last_sync_at timestamptz,
  last_sync_status text,
  last_error text,
  connection_source text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.ad_intel_settings TO authenticated;
GRANT ALL ON public.ad_intel_settings TO service_role;
ALTER TABLE public.ad_intel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages ad settings" ON public.ad_intel_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
INSERT INTO public.ad_intel_settings (id) VALUES (1);

-- Meta metrik ek alanları
ALTER TABLE public.meta_daily_metrics
  ADD COLUMN reach integer, ADD COLUMN frequency numeric, ADD COLUMN link_clicks integer,
  ADD COLUMN ctr numeric, ADD COLUMN cpc numeric, ADD COLUMN cpm numeric;

CREATE TABLE public.meta_ad_creatives (
  ad_id text PRIMARY KEY,
  ad_name text, creative_id text, thumbnail_url text, effective_status text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.meta_ad_creatives TO authenticated;
GRANT ALL ON public.meta_ad_creatives TO service_role;
ALTER TABLE public.meta_ad_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads creatives" ON public.meta_ad_creatives FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Meta CAPI olay kuyruğu
CREATE TABLE public.meta_capi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  event_name text NOT NULL,
  event_id text NOT NULL,
  user_id uuid,
  order_id uuid,
  value numeric,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','retrying')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX meta_capi_events_status_idx ON public.meta_capi_events(status, created_at);
GRANT SELECT ON public.meta_capi_events TO authenticated;
GRANT ALL ON public.meta_capi_events TO service_role;
ALTER TABLE public.meta_capi_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads capi events" ON public.meta_capi_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Test işaretleri
ALTER TABLE public.lead_attribution ADD COLUMN is_test boolean NOT NULL DEFAULT false;
ALTER TABLE public.analytics_events ADD COLUMN is_test boolean NOT NULL DEFAULT false;

-- AI öneri seviyeleri
ALTER TABLE public.ai_ad_recommendations
  ADD COLUMN level text NOT NULL DEFAULT 'campaign', ADD COLUMN entity_id text, ADD COLUMN entity_name text;

-- Lead puanı sunucu görevinden de okunabilsin
DO $$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.get_lead_intelligence(integer)'::regprocedure);
  d := replace(d, 'IF NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = ''admin'') THEN',
    'IF COALESCE(auth.role(),'''') <> ''service_role'' AND NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = ''admin'') THEN');
  EXECUTE d;
END $$;
GRANT EXECUTE ON FUNCTION public.get_lead_intelligence(integer) TO service_role;

-- Seviyeli performans raporu (yalnız ID ile eşleştirme, test verisi hariç)
DROP FUNCTION IF EXISTS public.get_ad_performance(integer);
CREATE OR REPLACE FUNCTION public.get_ad_performance(p_from date, p_to date, p_level text DEFAULT 'campaign', p_parent text DEFAULT NULL)
RETURNS TABLE(entity_id text, entity_name text, parent_id text, campaign_id text, spend numeric, impressions bigint, clicks bigint,
  link_clicks bigint, meta_leads bigint, active_days bigint, leads bigint, qualified bigint, registrations bigint,
  profiles bigint, checkouts bigint, paid bigint, revenue numeric, thumbnail_url text, creative_id text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_thr int; v_days int := GREATEST((current_date - p_from) + 1, 1);
BEGIN
  IF COALESCE(auth.role(),'') <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  IF p_level NOT IN ('campaign','adset','ad') THEN RAISE EXCEPTION 'level'; END IF;
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
  ), u AS (
    SELECT DISTINCT ON (a.user_id) a.user_id,
      CASE p_level
        WHEN 'campaign' THEN COALESCE(NULLIF(a.first_touch->>'meta_campaign_id',''), NULLIF(a.last_touch->>'meta_campaign_id',''))
        WHEN 'adset' THEN COALESCE(NULLIF(a.first_touch->>'meta_adset_id',''), NULLIF(a.last_touch->>'meta_adset_id',''))
        ELSE COALESCE(NULLIF(a.first_touch->>'meta_ad_id',''), NULLIF(a.last_touch->>'meta_ad_id','')) END eid
    FROM lead_attribution a
    WHERE a.user_id IS NOT NULL AND NOT a.is_test
      AND a.first_visit_at::date BETWEEN p_from AND p_to
    ORDER BY a.user_id, a.first_visit_at
  ), li AS (
    SELECT l.user_id, l.score, l.paid, l.revenue FROM get_lead_intelligence(v_days) l
  ), agg AS (
    SELECT u.eid,
      count(*) lds,
      count(*) FILTER (WHERE li.score >= v_thr OR li.paid) q,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=u.user_id AND e.event_name='registration_completed')
                          OR EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=u.user_id)) regs,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM specialists s WHERE s.user_id=u.user_id)) prof,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id=u.user_id AND e.event_name='checkout_started')) chk,
      count(*) FILTER (WHERE li.paid) pd,
      COALESCE(sum(li.revenue) FILTER (WHERE li.paid),0) rev
    FROM u LEFT JOIN li ON li.user_id = u.user_id
    WHERE u.eid IS NOT NULL GROUP BY u.eid
  )
  SELECT m.eid, m.ename, m.pid, m.cid, COALESCE(m.sp,0), m.imp, m.clk, m.lc, m.ml, m.ad_days,
    COALESCE(agg.lds,0), COALESCE(agg.q,0), COALESCE(agg.regs,0), COALESCE(agg.prof,0), COALESCE(agg.chk,0),
    COALESCE(agg.pd,0), COALESCE(agg.rev,0),
    (SELECT c.thumbnail_url FROM meta_ad_creatives c WHERE p_level='ad' AND c.ad_id=m.eid),
    (SELECT c.creative_id FROM meta_ad_creatives c WHERE p_level='ad' AND c.ad_id=m.eid)
  FROM m LEFT JOIN agg ON agg.eid = m.eid
  ORDER BY m.sp DESC NULLS LAST;
END $$;
REVOKE ALL ON FUNCTION public.get_ad_performance(date,date,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_performance(date,date,text,text) TO authenticated, service_role;

-- Attribution Debugger (kişisel veri yok)
CREATE OR REPLACE FUNCTION public.get_attribution_debug()
RETURNS TABLE(visit_at timestamptz, campaign_id text, adset_id text, ad_id text, utm_source text, utm_campaign text,
  has_fbclid boolean, has_fbc boolean, has_fbp boolean, registered boolean, purchased boolean, is_test boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  RETURN QUERY
  SELECT a.last_visit_at,
    COALESCE(a.last_touch->>'meta_campaign_id', a.first_touch->>'meta_campaign_id'),
    COALESCE(a.last_touch->>'meta_adset_id', a.first_touch->>'meta_adset_id'),
    COALESCE(a.last_touch->>'meta_ad_id', a.first_touch->>'meta_ad_id'),
    COALESCE(a.last_touch->>'utm_source', a.first_touch->>'utm_source'),
    COALESCE(a.last_touch->>'utm_campaign', a.first_touch->>'utm_campaign'),
    (a.last_touch ? 'fbclid') OR (a.first_touch ? 'fbclid'),
    (a.last_touch ? 'fbc') OR (a.first_touch ? 'fbc'),
    (a.last_touch ? 'fbp') OR (a.first_touch ? 'fbp'),
    a.user_id IS NOT NULL AND EXISTS (SELECT 1 FROM specialists s WHERE s.user_id = a.user_id),
    a.user_id IS NOT NULL AND EXISTS (SELECT 1 FROM user_profiles up JOIN orders o ON lower(o.customer_email)=lower(up.email)
      WHERE up.user_id = a.user_id AND o.status IN ('approved','completed') AND o.deleted_at IS NULL),
    a.is_test
  FROM lead_attribution a
  WHERE a.last_touch ?| ARRAY['meta_campaign_id','meta_adset_id','meta_ad_id','utm_source','fbclid']
     OR a.first_touch ?| ARRAY['meta_campaign_id','meta_adset_id','meta_ad_id','utm_source','fbclid']
  ORDER BY a.last_visit_at DESC LIMIT 20;
END $$;
REVOKE ALL ON FUNCTION public.get_attribution_debug() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attribution_debug() TO authenticated;

-- Admin test ziyareti (is_test = true, KPI'lara girmez)
CREATE OR REPLACE FUNCTION public.create_test_ad_visit()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sid text := 'test_' || gen_random_uuid()::text;
  v_touch jsonb := jsonb_build_object('utm_source','facebook','utm_medium','paid','utm_campaign','TEST_CAMPAIGN',
    'utm_content','TEST_AD','meta_campaign_id','TEST_CAMPAIGN','meta_adset_id','TEST_ADSET','meta_ad_id','TEST_AD',
    'fbclid','TEST_FBCLID','landing_page','/kayit-ol','at', now());
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  INSERT INTO lead_attribution(anonymous_session_id, first_touch, last_touch, is_test) VALUES (v_sid, v_touch, v_touch, true);
  INSERT INTO analytics_events(event_id, anonymous_session_id, event_name, event_properties, utm_source, utm_campaign,
    utm_content, meta_campaign_id, meta_adset_id, meta_ad_id, is_test)
  VALUES (gen_random_uuid()::text, v_sid, 'landing_page_view', '{"test":true}', 'facebook', 'TEST_CAMPAIGN', 'TEST_AD',
    'TEST_CAMPAIGN', 'TEST_ADSET', 'TEST_AD', true);
  RETURN v_sid;
END $$;
REVOKE ALL ON FUNCTION public.create_test_ad_visit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_test_ad_visit() TO authenticated;