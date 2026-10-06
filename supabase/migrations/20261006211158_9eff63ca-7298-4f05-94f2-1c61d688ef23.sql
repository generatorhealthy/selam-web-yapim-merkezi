CREATE TABLE public.meta_daily_metrics (
  date date NOT NULL,
  ad_id text NOT NULL,
  ad_name text, adset_id text, adset_name text, campaign_id text, campaign_name text,
  spend numeric NOT NULL DEFAULT 0, impressions integer NOT NULL DEFAULT 0, clicks integer NOT NULL DEFAULT 0,
  meta_leads integer NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, ad_id)
);
GRANT SELECT ON public.meta_daily_metrics TO authenticated;
GRANT ALL ON public.meta_daily_metrics TO service_role;
ALTER TABLE public.meta_daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads meta metrics" ON public.meta_daily_metrics FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE TABLE public.meta_purchase_reports (
  order_id uuid PRIMARY KEY,
  event_id text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL,
  response text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.meta_purchase_reports TO authenticated;
GRANT ALL ON public.meta_purchase_reports TO service_role;
ALTER TABLE public.meta_purchase_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads purchase reports" ON public.meta_purchase_reports FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE TABLE public.ai_ad_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text, campaign_name text,
  decision text NOT NULL, confidence text NOT NULL, reason text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  period_days integer NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_ad_recommendations TO authenticated;
GRANT ALL ON public.ai_ad_recommendations TO service_role;
ALTER TABLE public.ai_ad_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads ai recs" ON public.ai_ad_recommendations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE OR REPLACE FUNCTION public.get_ad_performance(p_days integer DEFAULT 30)
RETURNS TABLE(campaign_id text, campaign_name text, spend numeric, impressions bigint, clicks bigint,
  meta_leads bigint, leads bigint, registrations bigint, checkouts bigint, paid bigint, revenue numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(auth.role(),'') <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  RETURN QUERY
  WITH m AS (
    SELECT d.campaign_id cid, max(d.campaign_name) cname, sum(d.spend) sp, sum(d.impressions)::bigint imp,
      sum(d.clicks)::bigint clk, sum(d.meta_leads)::bigint ml
    FROM meta_daily_metrics d WHERE d.date >= current_date - GREATEST(p_days,1) GROUP BY d.campaign_id
  ), u AS (
    SELECT a.user_id,
      COALESCE(NULLIF(a.first_touch->>'meta_campaign_id',''), NULLIF(a.last_touch->>'meta_campaign_id','')) cid,
      COALESCE(NULLIF(a.first_touch->>'utm_campaign',''), NULLIF(a.last_touch->>'utm_campaign','')) cname
    FROM lead_attribution a
    WHERE a.user_id IS NOT NULL AND a.first_visit_at >= now() - make_interval(days => GREATEST(p_days,1))
  ), um AS (
    SELECT COALESCE(u.cid, (SELECT m.cid FROM m WHERE m.cname = u.cname LIMIT 1)) cid, u.user_id
    FROM u
  ), agg AS (
    SELECT um.cid,
      count(DISTINCT um.user_id) lds,
      count(DISTINCT um.user_id) FILTER (WHERE EXISTS (SELECT 1 FROM specialists s WHERE s.user_id = um.user_id)) regs,
      count(DISTINCT um.user_id) FILTER (WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.user_id = um.user_id AND e.event_name='checkout_started')) chk,
      count(DISTINCT um.user_id) FILTER (WHERE pay.amt > 0) pd,
      COALESCE(sum(pay.amt),0) rev
    FROM um
    LEFT JOIN user_profiles up ON up.user_id = um.user_id
    LEFT JOIN LATERAL (SELECT sum(o.amount) amt FROM orders o
      WHERE lower(o.customer_email) = lower(up.email) AND o.status IN ('approved','completed')
        AND o.deleted_at IS NULL AND o.created_at >= now() - make_interval(days => GREATEST(p_days,1))) pay ON true
    WHERE um.cid IS NOT NULL
    GROUP BY um.cid
  )
  SELECT m.cid, m.cname, COALESCE(m.sp,0), COALESCE(m.imp,0), COALESCE(m.clk,0), COALESCE(m.ml,0),
    COALESCE(agg.lds,0), COALESCE(agg.regs,0), COALESCE(agg.chk,0), COALESCE(agg.pd,0), COALESCE(agg.rev,0)
  FROM m LEFT JOIN agg ON agg.cid = m.cid
  ORDER BY m.sp DESC NULLS LAST;
END $$;
REVOKE ALL ON FUNCTION public.get_ad_performance(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ad_performance(integer) TO authenticated, service_role;