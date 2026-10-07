CREATE OR REPLACE FUNCTION public.get_registration_funnel(p_cohort text DEFAULT 'v2', p_dim text DEFAULT 'all')
RETURNS TABLE(grp text, stage text, stage_order int, n int, measurable boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_version constant text := 'v2_2026-10-07';
  v_track_start constant timestamptz := '2026-10-06 21:44:00+00';
  v_release timestamptz;
BEGIN
  IF NOT (public.is_admin_user() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_cohort NOT IN ('v1','v2') OR p_dim NOT IN ('all','meta_ad_id','device','os','browser','app') THEN
    RAISE EXCEPTION 'invalid parameter';
  END IF;

  -- v2 başlangıcı: ilk v2 olayının gerçek zamanı (yayın gecikmesine karşı veriyle belirlenir)
  SELECT min(created_at) INTO v_release FROM analytics_events
   WHERE event_properties->>'form_version' = v_version AND NOT is_test;
  v_release := COALESCE(v_release, 'infinity'::timestamptz);

  RETURN QUERY
  WITH s AS (
    SELECT la.anonymous_session_id sid, la.user_id, la.first_visit_at,
           COALESCE(la.first_touch->>'meta_ad_id', la.last_touch->>'meta_ad_id') ad_id
    FROM lead_attribution la
    WHERE NOT la.is_test
      AND COALESCE(la.first_touch->>'meta_ad_id', la.last_touch->>'meta_ad_id') IS NOT NULL
      AND COALESCE(la.first_touch->>'meta_ad_id', la.last_touch->>'meta_ad_id') NOT IN ('111111','222222','333333')
      AND CASE WHEN p_cohort = 'v1' THEN la.first_visit_at >= v_track_start AND la.first_visit_at < v_release
               ELSE la.first_visit_at >= v_release END
  ),
  e AS (
    SELECT s.sid,
      bool_or(ev.event_name = 'landing_page_view') lv,
      bool_or(ev.event_name = 'registration_form_view') fv,
      bool_or(ev.event_name = 'first_field_focus') ff,
      bool_or(ev.event_name = 'email_entered') em,
      bool_or(ev.event_name = 'phone_entered') ph,
      bool_or(ev.event_name = 'step_1_submit_attempt') sub,
      bool_or(CASE WHEN p_cohort = 'v1' THEN ev.event_name = 'registration_started' ELSE ev.event_name = 'step_2_view' END) s2,
      bool_or(ev.event_name = 'registration_completed') rc,
      bool_or(ev.event_name = 'profile_completed') pc,
      bool_or(ev.event_name = 'checkout_started') co,
      max(ev.event_properties->>'device') FILTER (WHERE ev.event_name='registration_form_view') device,
      max(ev.event_properties->>'os') FILTER (WHERE ev.event_name='registration_form_view') os,
      max(ev.event_properties->>'browser') FILTER (WHERE ev.event_name='registration_form_view') browser,
      max(ev.event_properties->>'app') FILTER (WHERE ev.event_name='registration_form_view') app,
      bool_or(ev.event_name='registration_form_view' AND ev.event_properties->>'webdriver' = 'true') bot_wd,
      bool_or(ev.event_name='registration_form_view' AND ev.event_properties->>'visibility' = 'hidden') hidden_load
    FROM s LEFT JOIN analytics_events ev ON ev.anonymous_session_id = s.sid AND NOT ev.is_test
    GROUP BY s.sid
  ),
  j AS (
    SELECT s.*, e.*,
      -- Ödeme sayfası ve ödeme, kullanıcı başka oturumdan dönse de user_id ile bağlanır
      (e.co OR EXISTS (SELECT 1 FROM analytics_events x WHERE s.user_id IS NOT NULL AND x.user_id = s.user_id AND x.event_name='checkout_started' AND NOT x.is_test)) co2,
      EXISTS (SELECT 1 FROM orders o JOIN user_profiles p ON lower(p.email) = lower(o.customer_email)
              WHERE s.user_id IS NOT NULL AND p.user_id = s.user_id AND o.status IN ('approved','completed')
                AND o.deleted_at IS NULL AND COALESCE(o.approved_at, o.created_at) >= s.first_visit_at) paid
    FROM s JOIN e USING (sid)
  ),
  clean AS (
    -- Bot/ön yükleme: otomasyon tarayıcısı ya da gizli sekmede yüklenip hiç etkileşim olmayan oturumlar
    SELECT * FROM j WHERE NOT COALESCE(bot_wd,false) AND NOT (COALESCE(hidden_load,false) AND NOT COALESCE(ff,false))
  ),
  g AS (
    SELECT CASE p_dim WHEN 'all' THEN 'Tümü' WHEN 'meta_ad_id' THEN ad_id WHEN 'device' THEN COALESCE(device,'bilinmiyor')
             WHEN 'os' THEN COALESCE(os,'bilinmiyor') WHEN 'browser' THEN COALESCE(browser,'bilinmiyor') ELSE COALESCE(app,'bilinmiyor') END grp, *
    FROM clean
  )
  SELECT g.grp, st.stage, st.ord, count(*) FILTER (WHERE st.hit)::int,
         NOT (p_cohort = 'v1' AND st.stage IN ('form_view','first_field_focus','email_entered','phone_entered','step_1_submit_attempt'))
  FROM g CROSS JOIN LATERAL (VALUES
    ('landing_visit',1,true), ('form_view',2,COALESCE(g.fv,false)), ('first_field_focus',3,COALESCE(g.ff,false)),
    ('email_entered',4,COALESCE(g.em,false)), ('phone_entered',5,COALESCE(g.ph,false)),
    ('step_1_submit_attempt',6,COALESCE(g.sub,false)), ('step_2_view',7,COALESCE(g.s2,false)),
    ('registration_completed',8,COALESCE(g.rc,false)), ('profile_completed',9,COALESCE(g.pc,false)),
    ('checkout',10,COALESCE(g.co2,false)), ('paid',11,COALESCE(g.paid,false))
  ) st(stage, ord, hit)
  GROUP BY g.grp, st.stage, st.ord
  ORDER BY g.grp, st.ord;
END $$;
REVOKE ALL ON FUNCTION public.get_registration_funnel(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_registration_funnel(text,text) TO authenticated, service_role;