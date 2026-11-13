-- READ ONLY. Authorized database operator only; never exposed through a browser RPC.
-- Does not output checkout tokens, contact details, request headers or message bodies.
-- Shows the first naturally created new checkout session; no test purchase is created.
WITH first_session AS (
  SELECT * FROM public.payment_checkout_sessions ORDER BY created_at, id LIMIT 1
), evidence AS (
  SELECT s.id AS checkout_session_id, s.order_id, s.created_at, s.status AS session_status,
    s.conversation_id, (s.iyzico_token IS NOT NULL) AS token_bound,
    s.expected_amount, s.currency, s.expires_at,
    o.status AS order_status, o.payment_status, o.approved_at,
    r.id AS receipt_id, r.charge_reference, r.paid_at, r.amount AS paid_amount,
    r.currency AS paid_currency,
    (r.session_id=s.id AND r.order_id=o.id AND r.binding='checkout_session'
      AND r.amount=s.expected_amount AND r.currency=s.currency
      AND r.subscription_reference_code=o.subscription_reference_code
      AND r.customer_reference_code=o.iyzico_customer_reference_code) AS receipt_binding_matches,
    (SELECT count(*) FROM public.specialists x WHERE lower(x.email)=lower(o.customer_email)
      AND x.registration_source='self_registration') AS specialist_match_count,
    (SELECT bool_and(x.is_active) FROM public.specialists x WHERE lower(x.email)=lower(o.customer_email)
      AND x.registration_source='self_registration') AS specialist_active,
    o.invoice_sent, o.invoice_number, o.invoice_date, o.contract_emails_sent,
    (SELECT count(*) FROM net.http_request_queue q
      WHERE convert_from(q.body,'UTF8')::jsonb->>'orderId'=o.id::text
      AND q.url LIKE '%/create-birfatura-invoice') AS invoice_jobs_current_queue,
    (SELECT count(*) FROM net.http_request_queue q
      WHERE convert_from(q.body,'UTF8')::jsonb->>'orderId'=o.id::text
      AND (q.url LIKE '%/send-contract-emails' OR q.url LIKE '%/send-order%')) AS notice_jobs_current_queue
  FROM first_session s JOIN public.orders o ON o.id=s.order_id
  LEFT JOIN public.payment_receipts r ON r.session_id=s.id AND r.order_id=o.id
)
SELECT *, CASE
  WHEN receipt_id IS NULL THEN 'TAHSILAT_MAKBUZU_BEKLENIYOR'
  WHEN specialist_match_count=1 AND specialist_active=false THEN 'ODEME_VAR_AKTIVASYON_EKSIK_IKINCI_ODEME_ISTEMEYIN'
  WHEN specialist_match_count<>1 THEN 'UZMAN_SAHIPLIGI_PERSONEL_TEYIDI_GEREKIYOR'
  WHEN receipt_binding_matches IS NOT TRUE THEN 'ODEME_BAGI_PERSONEL_TEYIDI_GEREKIYOR'
  ELSE 'BAG_VE_AKTIVASYON_KAYITLI_IS_SAYISI_VE_TESLIM_TEYIDI_BEKLENIYOR'
END AS acceptance_status,
'Queue counts are a current snapshot, NOT historical job counts or delivery proof. Missing jobs remain unknown.' AS job_evidence_limit
FROM evidence;