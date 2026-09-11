CREATE INDEX IF NOT EXISTS idx_legal_evidence_specialist_email_lower ON public.legal_evidence (lower(specialist_email));
CREATE INDEX IF NOT EXISTS idx_legal_evidence_specialist_name_lower ON public.legal_evidence (lower(specialist_name));
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower ON public.orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_customer_name_lower ON public.orders (lower(customer_name));
CREATE INDEX IF NOT EXISTS idx_backup_orders_customer_email_lower ON public.backup_1788969601_orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_backup_orders_customer_name_lower ON public.backup_1788969601_orders (lower(customer_name));
CREATE INDEX IF NOT EXISTS idx_sms_logs_specialist_name_lower ON public.sms_logs (lower(specialist_name));
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_name_lower ON public.blog_posts (lower(author_name));
CREATE INDEX IF NOT EXISTS idx_backup_blog_posts_author_name_lower ON public.backup_1788969601_blog_posts (lower(author_name));

CREATE OR REPLACE FUNCTION public.admin_collect_litigation_evidence(_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  c public.litigation_cases;
  nm text;
  nm_plain text;
  em text;
  ph text;
  res jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  SELECT * INTO c FROM public.litigation_cases WHERE id = _case_id;
  IF NOT FOUND THEN RETURN '{}'::jsonb; END IF;

  nm := lower(btrim(c.defendant_name));
  nm_plain := lower(regexp_replace(nm, '^(uzm\\.?|psk\\.?|psikolog|dr\\.?)\\s+', '', 'i'));
  em := nullif(lower(btrim(coalesce(c.defendant_email, ''))), '');
  ph := nullif(right(regexp_replace(coalesce(c.defendant_phone, ''), '[^0-9]', '', 'g'), 10), '');

  WITH
  a AS MATERIALIZED (
    SELECT le.*
    FROM public.legal_evidence le
    WHERE lower(btrim(le.specialist_name)) IN (nm, nm_plain, 'psk. ' || nm_plain, 'uzm. psk. ' || nm_plain)
       OR (em IS NOT NULL AND lower(btrim(coalesce(le.specialist_email, ''))) = em)
       OR (ph IS NOT NULL AND right(regexp_replace(coalesce(le.specialist_phone, ''), '[^0-9]', '', 'g'), 10) = ph)
    ORDER BY le.created_at DESC
    LIMIT 20
  ),
  ids AS MATERIALIZED (
    SELECT DISTINCT sid FROM (
      SELECT c.specialist_id AS sid
      UNION ALL SELECT le.specialist_id FROM a le
    ) found WHERE sid IS NOT NULL
  ),
  profiles AS (
    SELECT jsonb_build_object(
      'id', le.id, 'deleted_at', coalesce(le.deleted_at, le.created_at),
      'created_at', le.created_at, 'specialist_id', le.specialist_id,
      'specialist_name', le.specialist_name, 'specialist_email', le.specialist_email,
      'specialist_phone', le.specialist_phone, 'specialist_tc_no', le.specialist_tc_no,
      'notes', le.notes, 'screenshot_urls', coalesce(to_jsonb(le.screenshot_urls), '[]'::jsonb),
      'profile_data', coalesce(le.profile_data, '{}'::jsonb)
    ) AS j FROM a le
  ),
  email_logs AS (
    SELECT e.value AS j FROM a le CROSS JOIN LATERAL
      jsonb_array_elements(CASE WHEN jsonb_typeof(le.email_logs) = 'array' THEN le.email_logs ELSE '[]'::jsonb END) e
  ),
  archived_orders AS (
    SELECT e.value AS j FROM a le CROSS JOIN LATERAL
      jsonb_array_elements(CASE WHEN jsonb_typeof(le.orders_data) = 'array' THEN le.orders_data ELSE '[]'::jsonb END) e
  ),
  live_orders AS (
    SELECT to_jsonb(o) AS j FROM public.orders o
    WHERE (em IS NOT NULL AND lower(o.customer_email) = em)
       OR lower(btrim(o.customer_name)) IN (nm, nm_plain)
       OR (ph IS NOT NULL AND right(regexp_replace(coalesce(o.customer_phone,''), '[^0-9]', '', 'g'), 10) = ph)
  ),
  backup_orders AS (
    SELECT to_jsonb(o) AS j FROM public.backup_1788969601_orders o
    WHERE (em IS NOT NULL AND lower(o.customer_email) = em)
       OR lower(btrim(o.customer_name)) IN (nm, nm_plain)
       OR (ph IS NOT NULL AND right(regexp_replace(coalesce(o.customer_phone,''), '[^0-9]', '', 'g'), 10) = ph)
  ),
  orders_all AS (
    SELECT j FROM archived_orders UNION ALL SELECT j FROM live_orders UNION ALL SELECT j FROM backup_orders
  ),
  referrals_all AS (
    SELECT to_jsonb(r) AS j FROM public.client_referrals r WHERE r.specialist_id IN (SELECT sid FROM ids)
    UNION ALL SELECT to_jsonb(r) FROM public.backup_1788969601_client_referrals r WHERE r.specialist_id IN (SELECT sid FROM ids)
    UNION ALL SELECT e.value FROM a le CROSS JOIN LATERAL
      jsonb_array_elements(CASE WHEN jsonb_typeof(le.referrals_data) = 'array' THEN le.referrals_data ELSE '[]'::jsonb END) e
  ),
  appts_all AS (
    SELECT to_jsonb(x) AS j FROM public.appointments x WHERE x.specialist_id IN (SELECT sid FROM ids)
    UNION ALL SELECT to_jsonb(x) FROM public.backup_1788969601_appointments x WHERE x.specialist_id IN (SELECT sid FROM ids)
  ),
  blogs_all AS (
    SELECT to_jsonb(b) AS j FROM public.blog_posts b
      WHERE b.specialist_id IN (SELECT sid FROM ids) OR lower(btrim(b.author_name)) IN (nm, nm_plain, 'psk. ' || nm_plain, 'uzm. psk. ' || nm_plain)
    UNION ALL SELECT to_jsonb(b) FROM public.backup_1788969601_blog_posts b
      WHERE b.specialist_id IN (SELECT sid FROM ids) OR lower(btrim(b.author_name)) IN (nm, nm_plain, 'psk. ' || nm_plain, 'uzm. psk. ' || nm_plain)
  ),
  sms_all AS (
    SELECT to_jsonb(s) AS j FROM public.sms_logs s
    WHERE lower(btrim(s.specialist_name)) IN (nm, nm_plain, 'psk. ' || nm_plain, 'uzm. psk. ' || nm_plain)
       OR (ph IS NOT NULL AND right(regexp_replace(coalesce(s.phone,''), '[^0-9]', '', 'g'), 10) = ph)
    ORDER BY s.sent_at DESC LIMIT 200
  ),
  proc_all AS (
    SELECT to_jsonb(p) AS j FROM public.legal_proceedings p
    WHERE lower(btrim(p.customer_name)) IN (nm, nm_plain)
  ),
  consents_all AS (
    SELECT to_jsonb(u) AS j FROM public.user_consent_logs u
    WHERE em IS NOT NULL AND lower(btrim(coalesce(u.email,''))) = em
  ),
  reviews_all AS (SELECT to_jsonb(r) AS j FROM public.reviews r WHERE r.specialist_id IN (SELECT sid FROM ids)),
  tests_all AS (SELECT to_jsonb(t) AS j FROM public.test_results t WHERE t.specialist_id IN (SELECT sid FROM ids))
  SELECT jsonb_build_object(
    'profiles', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM profiles),
    'emailLogs', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM email_logs),
    'orders', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', md5(j::text))) j FROM orders_all) q),
    'referrals', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', md5(j::text))) j FROM referrals_all) q),
    'appointments', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', md5(j::text))) j FROM appts_all) q),
    'blogs', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM (SELECT DISTINCT ON (coalesce(j->>'id', md5(j::text))) j FROM blogs_all) q),
    'sms', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM sms_all),
    'proceedings', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM proc_all),
    'consents', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM consents_all),
    'reviews', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM reviews_all),
    'testResults', (SELECT coalesce(jsonb_agg(j), '[]'::jsonb) FROM tests_all)
  ) INTO res;

  RETURN coalesce(res, '{}'::jsonb);
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_collect_litigation_evidence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_collect_litigation_evidence(uuid) TO authenticated, service_role;