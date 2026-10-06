
CREATE TABLE public.lead_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id text NOT NULL UNIQUE,
  user_id uuid UNIQUE,
  first_touch jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_touch jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.lead_attribution TO service_role;
GRANT SELECT ON public.lead_attribution TO authenticated;
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads attribution" ON public.lead_attribution FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  user_id uuid,
  anonymous_session_id text,
  event_name text NOT NULL,
  event_properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text, utm_campaign text, utm_content text,
  meta_campaign_id text, meta_adset_id text, meta_ad_id text,
  fbc text, fbp text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_user_idx ON public.analytics_events(user_id, created_at);
CREATE INDEX analytics_events_session_idx ON public.analytics_events(anonymous_session_id);
CREATE INDEX analytics_events_name_idx ON public.analytics_events(event_name, created_at);
GRANT ALL ON public.analytics_events TO service_role;
GRANT SELECT ON public.analytics_events TO authenticated;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads events" ON public.analytics_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE TABLE public.scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('professional','capacity','intent')),
  points integer NOT NULL DEFAULT 0,
  max_points integer,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.scoring_rules TO authenticated;
GRANT ALL ON public.scoring_rules TO service_role;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages scoring rules" ON public.scoring_rules FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

INSERT INTO public.scoring_rules (rule_key, rule_name, category, points, description) VALUES
('profile_completed','Profil tamamlandı','professional',15,'Uzman profili oluşturuldu'),
('has_bio','Hakkında yazısı var','professional',5,'Biyografi dolu'),
('has_education','Eğitim bilgisi var','professional',5,'Eğitim/üniversite dolu'),
('has_photo','Profil fotoğrafı var','professional',5,'Fotoğraf yüklü'),
('online_consultation','Online danışmanlık','capacity',10,'Online görüşme yapıyor'),
('face_to_face','Yüz yüze danışmanlık','capacity',5,'Yüz yüze görüşme yapıyor'),
('capacity_entered','Kapasite hesaplayıcı kullandı','capacity',5,'Kapasite sekmesinde seans girdi'),
('capacity_6_plus','Haftalık 6+ seans','capacity',10,'Haftalık planlanan seans 6 veya üzeri'),
('pricing_page_view','Fiyat/paket sayfası görüntüledi','intent',5,'Paket veya fiyat sayfası ziyareti'),
('registration_started','Kayıt başlattı','intent',5,'Hesap oluşturdu'),
('registration_completed','Kayıt tamamlandı','intent',15,'Sihirbazı bitirdi'),
('checkout_started','Ödeme sayfasına geçti','intent',20,'Ödeme başlatıldı'),
('payment_failed','Ödeme denedi','intent',5,'Başarısız da olsa ödeme denemesi');

CREATE TABLE public.lead_pipeline (
  user_id uuid PRIMARY KEY,
  stage text NOT NULL DEFAULT 'NEW_LEAD',
  manual boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lead_pipeline TO authenticated;
GRANT ALL ON public.lead_pipeline TO service_role;
ALTER TABLE public.lead_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages pipeline" ON public.lead_pipeline FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

CREATE TABLE public.lead_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  previous_stage text,
  new_stage text NOT NULL,
  changed_by uuid,
  change_source text NOT NULL DEFAULT 'SYSTEM',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_stage_history_user_idx ON public.lead_stage_history(user_id, created_at);
GRANT SELECT, INSERT ON public.lead_stage_history TO authenticated;
GRANT ALL ON public.lead_stage_history TO service_role;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages stage history" ON public.lead_stage_history FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Public event intake (anon allowed, whitelisted names, size-limited)
CREATE OR REPLACE FUNCTION public.track_lead_event(
  p_session_id text, p_event_name text, p_event_id text DEFAULT NULL,
  p_properties jsonb DEFAULT '{}'::jsonb, p_touch jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_first jsonb;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) > 100 THEN RETURN; END IF;
  IF p_event_name NOT IN ('landing_page_view','pricing_page_view','package_view','registration_started',
    'registration_step_completed','registration_completed','phone_verified','email_verified','profile_started',
    'profile_completed','dashboard_first_view','subscription_page_view','checkout_started','payment_attempted',
    'payment_failed','payment_completed','subscription_activated','subscription_cancelled','capacity_entered') THEN RETURN; END IF;
  IF length(p_properties::text) > 4000 OR length(p_touch::text) > 4000 THEN RETURN; END IF;

  INSERT INTO lead_attribution(anonymous_session_id, user_id, first_touch, last_touch)
  VALUES (p_session_id, v_uid, COALESCE(p_touch->'first','{}'), COALESCE(p_touch->'last','{}'))
  ON CONFLICT (anonymous_session_id) DO UPDATE
    SET last_touch = CASE WHEN EXCLUDED.last_touch <> '{}'::jsonb THEN EXCLUDED.last_touch ELSE lead_attribution.last_touch END,
        user_id = COALESCE(lead_attribution.user_id, EXCLUDED.user_id),
        last_visit_at = now()
  RETURNING first_touch INTO v_first;

  INSERT INTO analytics_events(event_id, user_id, anonymous_session_id, event_name, event_properties,
    utm_source, utm_campaign, utm_content, meta_campaign_id, meta_adset_id, meta_ad_id, fbc, fbp)
  VALUES (p_event_id, v_uid, p_session_id, p_event_name, COALESCE(p_properties,'{}'),
    v_first->>'utm_source', v_first->>'utm_campaign', v_first->>'utm_content',
    v_first->>'meta_campaign_id', v_first->>'meta_adset_id', v_first->>'meta_ad_id',
    p_touch->'last'->>'fbc', p_touch->'last'->>'fbp');

  IF v_uid IS NOT NULL THEN
    UPDATE analytics_events SET user_id = v_uid WHERE anonymous_session_id = p_session_id AND user_id IS NULL;
  END IF;
EXCEPTION WHEN unique_violation THEN RETURN;
END $$;
REVOKE ALL ON FUNCTION public.track_lead_event(text,text,text,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_lead_event(text,text,text,jsonb,jsonb) TO anon, authenticated;

-- Admin: lead list with score, class, stage, attribution
CREATE OR REPLACE FUNCTION public.get_lead_intelligence(p_days integer DEFAULT 30)
RETURNS TABLE(user_id uuid, name text, email text, phone text, created_at timestamptz,
  specialty text, city text, score integer, professional integer, capacity integer, intent integer,
  lead_class text, stage text, paid boolean, revenue numeric, signals text[],
  utm_source text, utm_campaign text, utm_content text, meta_campaign_id text, meta_adset_id text, meta_ad_id text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin') THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  RETURN QUERY
  WITH base AS (
    SELECT up.user_id, up.name, up.email, up.phone, up.created_at
    FROM user_profiles up
    WHERE up.role = 'specialist' AND up.created_at >= now() - make_interval(days => GREATEST(p_days,1))
  ), ev AS (
    SELECT e.user_id, array_agg(DISTINCT e.event_name) names,
      max(CASE WHEN e.event_name='capacity_entered' THEN COALESCE((e.event_properties->>'sessions')::int,0) END) sessions
    FROM analytics_events e WHERE e.user_id IN (SELECT b.user_id FROM base b) GROUP BY e.user_id
  ), pay AS (
    SELECT lower(o.customer_email) em, sum(o.amount) amt
    FROM orders o WHERE o.status IN ('approved','completed') AND o.deleted_at IS NULL GROUP BY 1
  ), sig AS (
    SELECT b.*, s.specialty, s.city, s.id IS NOT NULL has_spec,
      COALESCE(p.amt,0) amt, p.em IS NOT NULL is_paid,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN s.id IS NOT NULL THEN 'profile_completed' END,
        CASE WHEN COALESCE(s.bio,'')<>'' THEN 'has_bio' END,
        CASE WHEN COALESCE(s.education,'')<>'' OR COALESCE(s.university,'')<>'' THEN 'has_education' END,
        CASE WHEN COALESCE(s.profile_picture,'')<>'' THEN 'has_photo' END,
        CASE WHEN s.online_consultation THEN 'online_consultation' END,
        CASE WHEN s.face_to_face_consultation THEN 'face_to_face' END,
        CASE WHEN 'capacity_entered' = ANY(ev.names) THEN 'capacity_entered' END,
        CASE WHEN COALESCE(ev.sessions,0) >= 6 THEN 'capacity_6_plus' END,
        CASE WHEN ev.names && ARRAY['pricing_page_view','package_view','subscription_page_view'] THEN 'pricing_page_view' END,
        'registration_started',
        CASE WHEN s.id IS NOT NULL OR 'registration_completed' = ANY(ev.names) THEN 'registration_completed' END,
        CASE WHEN 'checkout_started' = ANY(ev.names) THEN 'checkout_started' END,
        CASE WHEN ev.names && ARRAY['payment_failed','payment_attempted'] THEN 'payment_failed' END
      ], NULL) sigs
    FROM base b
    LEFT JOIN LATERAL (SELECT * FROM specialists sp WHERE sp.user_id = b.user_id LIMIT 1) s ON true
    LEFT JOIN ev ON ev.user_id = b.user_id
    LEFT JOIN pay p ON p.em = lower(b.email)
  ), scored AS (
    SELECT sg.*,
      COALESCE((SELECT sum(r.points) FROM scoring_rules r WHERE r.enabled AND r.category='professional' AND r.rule_key = ANY(sg.sigs)),0)::int pro,
      COALESCE((SELECT sum(r.points) FROM scoring_rules r WHERE r.enabled AND r.category='capacity' AND r.rule_key = ANY(sg.sigs)),0)::int cap,
      COALESCE((SELECT sum(r.points) FROM scoring_rules r WHERE r.enabled AND r.category='intent' AND r.rule_key = ANY(sg.sigs)),0)::int inten,
      (SELECT NULLIF(sum(r.points),0) FROM scoring_rules r WHERE r.enabled) total_max
    FROM sig sg
  )
  SELECT sc.user_id, sc.name, sc.email, sc.phone, sc.created_at, sc.specialty, sc.city,
    LEAST(100, ROUND(100.0*(sc.pro+sc.cap+sc.inten)/COALESCE(sc.total_max,1)))::int,
    sc.pro, sc.cap, sc.inten,
    CASE WHEN sc.is_paid THEN 'CONVERTED'
      WHEN ROUND(100.0*(sc.pro+sc.cap+sc.inten)/COALESCE(sc.total_max,1)) >= 80 THEN 'HOT'
      WHEN ROUND(100.0*(sc.pro+sc.cap+sc.inten)/COALESCE(sc.total_max,1)) >= 60 THEN 'HIGH'
      WHEN ROUND(100.0*(sc.pro+sc.cap+sc.inten)/COALESCE(sc.total_max,1)) >= 40 THEN 'MEDIUM'
      ELSE 'LOW' END,
    COALESCE((SELECT lp.stage FROM lead_pipeline lp WHERE lp.user_id = sc.user_id AND lp.manual),
      CASE WHEN sc.is_paid THEN 'PAID_SUBSCRIBER'
        WHEN 'payment_failed' = ANY(sc.sigs) THEN 'PAYMENT_ATTEMPTED'
        WHEN 'checkout_started' = ANY(sc.sigs) THEN 'CHECKOUT_STARTED'
        WHEN sc.has_spec THEN 'PROFILE_COMPLETED'
        WHEN 'registration_completed' = ANY(sc.sigs) THEN 'REGISTERED'
        ELSE 'REGISTRATION_STARTED' END),
    sc.is_paid, sc.amt, sc.sigs,
    la.first_touch->>'utm_source', la.first_touch->>'utm_campaign', la.first_touch->>'utm_content',
    la.first_touch->>'meta_campaign_id', la.first_touch->>'meta_adset_id', la.first_touch->>'meta_ad_id'
  FROM scored sc
  LEFT JOIN LATERAL (SELECT a.first_touch FROM lead_attribution a WHERE a.user_id = sc.user_id ORDER BY a.first_visit_at LIMIT 1) la ON true
  ORDER BY sc.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.get_lead_intelligence(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_lead_intelligence(integer) TO authenticated;
