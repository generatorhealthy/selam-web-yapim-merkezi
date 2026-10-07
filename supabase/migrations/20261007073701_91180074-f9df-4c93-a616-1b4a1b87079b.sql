ALTER TABLE public.ad_intel_settings ADD COLUMN attribution_started_at timestamptz;
UPDATE public.ad_intel_settings SET attribution_started_at = COALESCE((SELECT min(created_at) FROM public.analytics_events WHERE NOT is_test), now()) WHERE id=1;
ALTER TABLE public.ad_intel_settings ALTER COLUMN attribution_started_at SET DEFAULT now();
CREATE OR REPLACE FUNCTION public.get_ad_attribution_coverage(p_from date,p_to date,p_level text DEFAULT 'campaign',p_parent text DEFAULT NULL)
RETURNS TABLE(entity_id text, attribution_started_at timestamptz, tracked_visits bigint, tracked_spend numeric, tracked_active_days bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_start timestamptz;
BEGIN
 IF COALESCE(auth.role(),'') <> 'service_role' AND NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'yetkisiz'; END IF;
 IF p_level NOT IN ('campaign','adset','ad') THEN RAISE EXCEPTION 'level'; END IF;
 SELECT s.attribution_started_at INTO v_start FROM public.ad_intel_settings s WHERE id=1;
 RETURN QUERY WITH traffic AS (
 SELECT e.meta_ad_id ad_id,min(e.created_at) first_seen,
 count(DISTINCT e.anonymous_session_id) FILTER(WHERE (e.created_at AT TIME ZONE 'Europe/Istanbul')::date BETWEEN p_from AND p_to)::bigint visits
 FROM public.analytics_events e WHERE NOT e.is_test AND e.created_at>=v_start AND NULLIF(e.meta_ad_id,'') IS NOT NULL AND e.meta_ad_id<>'333333'
 GROUP BY e.meta_ad_id
 ), metrics AS (
 SELECT CASE p_level WHEN 'campaign' THEN d.campaign_id WHEN 'adset' THEN d.adset_id ELSE d.ad_id END eid,d.ad_id,
 sum(d.spend) FILTER(WHERE d.date > (GREATEST(v_start,t.first_seen) AT TIME ZONE 'Europe/Istanbul')::date AND t.ad_id IS NOT NULL) sp,
 array_agg(DISTINCT d.date) FILTER(WHERE d.spend>0 AND d.date > (GREATEST(v_start,t.first_seen) AT TIME ZONE 'Europe/Istanbul')::date AND t.ad_id IS NOT NULL) days,
 max(t.visits) visits
 FROM public.meta_daily_metrics d LEFT JOIN traffic t ON t.ad_id=d.ad_id
 WHERE d.date BETWEEN p_from AND p_to AND (p_parent IS NULL OR (p_level='adset' AND d.campaign_id=p_parent) OR (p_level='ad' AND d.adset_id=p_parent)) GROUP BY 1,d.ad_id
 )
 SELECT m.eid,v_start,COALESCE(sum(m.visits),0)::bigint,COALESCE(sum(m.sp),0),
 (SELECT count(DISTINCT x.day) FROM metrics n CROSS JOIN LATERAL unnest(n.days) x(day) WHERE n.eid=m.eid)::bigint
 FROM metrics m GROUP BY m.eid;
END $$;
REVOKE ALL ON FUNCTION public.get_ad_attribution_coverage(date,date,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_ad_attribution_coverage(date,date,text,text) TO authenticated,service_role;