
CREATE OR REPLACE FUNCTION public.admin_collect_litigation_evidence(_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  c public.litigation_cases;
  pat text;
  em text;
  ph text;
  res jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  SELECT * INTO c FROM public.litigation_cases WHERE id = _case_id;
  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;

  pat := '%' || regexp_replace(btrim(c.defendant_name), '[[:space:]]+', '%', 'g') || '%';
  em := nullif(btrim(coalesce(c.defendant_email, '')), '');
  ph := nullif(right(regexp_replace(coalesce(c.defendant_phone, ''), '[^0-9]', '', 'g'), 10), '');

  WITH a AS (
    SELECT * FROM public.legal_evidence le
    WHERE le.specialist_name ILIKE pat
       OR (em IS NOT NULL AND lower(coalesce(le.specialist_email,'')) = lower(em))
       OR (ph IS NOT NULL AND regexp_replace(coalesce(le.specialist_phone,''), '[^0-9]', '', 'g') LIKE '%' || ph)
  ),
  ids AS (
    SELECT DISTINCT sid FROM (
      SELECT c.specialist_id AS sid
      UNION SELECT le.specialist_id FROM a le
    ) t WHERE sid IS NOT NULL
  ),
  profiles AS (
    SELECT jsonb_build_object(
      'id', le.id,
      'deleted_at', coalesce(le.deleted_at, le.created_at),
      'created_at', le.created_at,
      'specialist_name', le.specialist_name,
      'specialist_email', le.specialist_email,
      'specialist_phone', le.specialist_phone,
      'specialist_tc_no', le.specialist_tc_no,
      'notes', le.notes,
      'screenshot_urls', to_jsonb(le.screenshot_urls),
      'profile_data', coalesce(le.profile_data, '{}'::jsonb)
    ) AS j
    FROM a le
  ),
  email_logs AS (
    SELECT e.value AS j FROM a le,
      jsonb_array_elements(CASE WHEN jsonb_typeof(le.email_logs) = 'array' THEN le.email_logs ELSE '[]'::jsonb END) e
  ),
  orders_all AS (
    SELECT to_jsonb(o) AS j FROM public.orders o
     WHERE (em IS NOT NULL AND o.customer_email ILIKE '%' || em || '%')
        OR o.customer_name ILIKE pat
        OR (ph IS NOT NULL AND regexp_replace(coalesce(o.customer_phone,''), '[^0-9]', '', 'g') LIKE '%' || ph)
    UNION ALL
    SELECT to_jsonb(o) FROM public.backup_1788969601_orders o
     WHERE (em IS NOT NULL AND o.customer_email ILIKE '%' || em || '%')
        OR o.customer_name ILIKE pat
        OR (ph IS NOT NULL AND regexp_replace(coalesce(o.customer_phone,''), '[^0-9]', '', 'g') LIKE '%' || ph)
    UNION ALL
    SELECT e.value FROM a le,
      jsonb_array_elements(CASE WHEN jsonb_typeof(le.orders_data) = 'array' THEN le.orders_data ELSE '[]'::jsonb END) e
  ),
  referrals_all AS (
    SELECT to_jsonb(r) AS j FROM public.client_referrals r WHERE r.specialist_id IN (SELECT sid FROM ids)
    UNION ALL
    SELECT to_jsonb(r) FROM public.backup_1788969601_client_referrals r WHERE r.specialist_id IN (SELECT sid FROM ids)
    UNION ALL
    SELECT e.value FROM a le,
      jsonb_array_elements(CASE WHEN jsonb_typeof(le.referrals_data) = 'array' THEN le.referrals_data ELSE '[]'::jsonb END) e
  ),
  appts_all AS (
    SELECT to_jsonb(x) AS j FROM public.appointments x WHERE x.specialist_id IN (SELECT sid FROM ids)
    UNION ALL
    SELECT to_jsonb(x) FROM public.backup_1788969601_appointments x WHERE x.specialist_id IN (SELECT sid FROM ids)
  ),
  blogs_all AS (
    SELECT to_jsonb(b) AS j FROM public.blog_posts b
     WHERE b.author_name ILIKE pat OR b.specialist_id IN (SELECT sid FROM ids)
    UNION ALL
    SELECT to_jsonb(b) FROM public.backup_1788969601_blog_posts b
     WHERE b.author_name ILIKE pat OR b.specialist_id IN (SELECT sid FROM ids)
  ),
  sms_all AS (
    SELECT to_jsonb(s) AS j FROM public.sms_logs s
     WHERE s.specialist_name ILIKE pat
        OR (ph IS NOT NULL AND regexp_replace(coalesce(s.phone,''), '[^0-9]', '', 'g') LIKE '%' || ph)
  ),
  proc_all AS (
    SELECT to_jsonb(p) AS j FROM public.legal_proceedings p
     WHERE p.customer_name ILIKE pat
        OR (em IS NOT NULL AND coalesce(p.customer_email,'') ILIKE '%' || em || '%')
  ),
  consents_all AS (
    SELECT to_jsonb(u) AS j FROM public.user_consent_logs u
     WHERE (em IS NOT NULL AND coalesce(u.email,'') ILIKE '%' || em || '%')
        OR (ph IS NOT NULL AND regexp_replace(coalesce(u.phone,''), '[^0-9]', '', 'g') LIKE '%' || ph)
  ),
  reviews_all AS (
    SELECT to_jsonb(r) AS j FROM public.reviews r WHERE r.specialist_id IN (SELECT sid FROM ids)
  ),
  tests_all AS (
    SELECT to_jsonb(t) AS j FROM public.test_results t WHERE t.specialist_id IN (SELECT sid FROM ids)
  )
  SELECT jsonb_build_object(
    'profiles',     (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM profiles),
    'emailLogs',    (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM email_logs),
    'orders',       (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', j::text)) j FROM orders_all) x),
    'referrals',    (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', j::text)) j FROM referrals_all) x),
    'appointments', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', j::text)) j FROM appts_all) x),
    'blogs',        (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', j::text)) j FROM blogs_all) x),
    'sms',          (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM sms_all),
    'proceedings',  (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM proc_all),
    'consents',     (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM consents_all),
    'reviews',      (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM reviews_all),
    'testResults',  (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM tests_all)
  ) INTO res;

  RETURN coalesce(res, '{}'::jsonb);
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_collect_litigation_evidence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_collect_litigation_evidence(uuid) TO authenticated, service_role;
