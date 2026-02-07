-- Son 60 günde silinen siparişlerin verilerini legal_evidence tablosuna aktar
-- Bu kayıtlar geçmiş silme işlemlerinden gelen verilerdir

INSERT INTO public.legal_evidence (
  specialist_name,
  specialist_email,
  specialist_phone,
  specialist_tc_no,
  profile_data,
  orders_data,
  email_logs,
  notes,
  deleted_at
)
SELECT 
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.customer_tc_no,
  jsonb_build_object(
    'package_name', o.package_name,
    'package_type', o.package_type,
    'customer_address', o.customer_address,
    'customer_city', o.customer_city,
    'customer_type', o.customer_type,
    'registration_date', o.created_at
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', o.id,
      'amount', o.amount,
      'package_name', o.package_name,
      'status', o.status,
      'payment_method', o.payment_method,
      'created_at', o.created_at,
      'invoice_number', o.invoice_number
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'order_id', o.id,
      'package_name', o.package_name,
      'contract_sent', o.contract_emails_sent,
      'invoice_sent', o.invoice_sent,
      'invoice_number', o.invoice_number,
      'contract_ip', o.contract_ip_address,
      'sent_at', o.contract_generated_at
    )
  ),
  'Geçmiş silme işleminden aktarıldı (orders tablosundan)',
  o.deleted_at
FROM orders o
WHERE o.deleted_at IS NOT NULL 
  AND o.deleted_at >= NOW() - INTERVAL '60 days'
  AND o.customer_email NOT LIKE '%test%'
  AND o.customer_name NOT LIKE '%test%'
  AND o.customer_tc_no != '11111111111'
ON CONFLICT DO NOTHING;