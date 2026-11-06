CREATE TABLE public.seo_keyword_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  query text NOT NULL,
  page text NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  position numeric NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seo_kw_period_idx ON public.seo_keyword_snapshots(period, impressions DESC);
GRANT SELECT ON public.seo_keyword_snapshots TO authenticated;
GRANT ALL ON public.seo_keyword_snapshots TO service_role;
ALTER TABLE public.seo_keyword_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read kw" ON public.seo_keyword_snapshots FOR SELECT TO authenticated USING (public.is_admin_user());

CREATE TABLE public.seo_page_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  duration_ms integer NOT NULL DEFAULT 0,
  from_search boolean NOT NULL DEFAULT false,
  referrer_host text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seo_eng_created_idx ON public.seo_page_engagement(created_at DESC);
CREATE INDEX seo_eng_path_idx ON public.seo_page_engagement(path);
GRANT INSERT ON public.seo_page_engagement TO anon, authenticated;
GRANT SELECT ON public.seo_page_engagement TO authenticated;
GRANT ALL ON public.seo_page_engagement TO service_role;
ALTER TABLE public.seo_page_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert engagement" ON public.seo_page_engagement FOR INSERT TO anon, authenticated
  WITH CHECK (length(path) <= 300 AND duration_ms BETWEEN 0 AND 3600000 AND path NOT LIKE '/divan_paneli%');
CREATE POLICY "admin read engagement" ON public.seo_page_engagement FOR SELECT TO authenticated USING (public.is_admin_user());

CREATE TABLE public.seo_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  issue text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  main_query text,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  position numeric NOT NULL DEFAULT 0,
  current_title text,
  current_description text,
  suggested_title text,
  suggested_description text,
  status text NOT NULL DEFAULT 'pending',
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seo_sugg_open_uq ON public.seo_suggestions(page, issue) WHERE status = 'pending';
GRANT SELECT, UPDATE ON public.seo_suggestions TO authenticated;
GRANT ALL ON public.seo_suggestions TO service_role;
ALTER TABLE public.seo_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read sugg" ON public.seo_suggestions FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE POLICY "admin update sugg" ON public.seo_suggestions FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

CREATE TABLE public.seo_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  rows_fetched integer NOT NULL DEFAULT 0,
  suggestions_created integer NOT NULL DEFAULT 0,
  error text
);
GRANT SELECT ON public.seo_sync_runs TO authenticated;
GRANT ALL ON public.seo_sync_runs TO service_role;
ALTER TABLE public.seo_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read runs" ON public.seo_sync_runs FOR SELECT TO authenticated USING (public.is_admin_user());

CREATE OR REPLACE FUNCTION public.get_seo_page_engagement(_days integer DEFAULT 28)
RETURNS TABLE(path text, views bigint, search_views bigint, avg_seconds numeric, median_seconds numeric, bounce_rate numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.path, count(*), count(*) FILTER (WHERE e.from_search),
    round(avg(e.duration_ms)/1000.0, 1),
    round((percentile_cont(0.5) WITHIN GROUP (ORDER BY e.duration_ms))::numeric/1000.0, 1),
    round(100.0 * count(*) FILTER (WHERE e.duration_ms < 10000) / greatest(count(*),1), 1)
  FROM public.seo_page_engagement e
  WHERE public.is_admin_user() AND e.created_at > now() - make_interval(days => greatest(1, least(_days, 365)))
  GROUP BY e.path ORDER BY count(*) DESC LIMIT 2000;
$$;
REVOKE ALL ON FUNCTION public.get_seo_page_engagement(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_seo_page_engagement(integer) TO authenticated;