-- Read-only synthetic regression checks against the deployed predicate.
WITH fixture AS (
 SELECT '{"id":"11111111-1111-4111-8111-111111111111","status":"approved","payment_method":"banka_havalesi","amount":3600,"invoice_sent":false,"invoice_number":null,"deleted_at":null}'::jsonb AS old_row
), cases AS (
 SELECT 'approved bank queue allowed' AS rule, old_row, old_row || '{"invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z"}'::jsonb AS new_row, true AS expected FROM fixture
 UNION ALL SELECT 'amount change rejected',old_row,old_row || '{"invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z","amount":1}'::jsonb,false FROM fixture
 UNION ALL SELECT 'pending cannot queue',old_row || '{"status":"pending"}'::jsonb,old_row || '{"status":"pending","invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z"}'::jsonb,false FROM fixture
 UNION ALL SELECT 'paid status change rejected',old_row,old_row || '{"invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z","payment_status":"paid"}'::jsonb,false FROM fixture
 UNION ALL SELECT 'invoice number write rejected',old_row,old_row || '{"invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z","invoice_number":"FAKE"}'::jsonb,false FROM fixture
 UNION ALL SELECT 'already queued cannot requeue',old_row || '{"invoice_sent":true}'::jsonb,old_row || '{"invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z"}'::jsonb,false FROM fixture
 UNION ALL SELECT 'deleted cannot queue',old_row || '{"deleted_at":"2026-11-15T00:00:00Z"}'::jsonb,old_row || '{"deleted_at":"2026-11-15T00:00:00Z","invoice_sent":true,"invoice_date":"2026-11-16T07:30:00Z"}'::jsonb,false FROM fixture
)
SELECT rule, public.invoice_queue_update_only(old_row,new_row)=expected AS passed FROM cases;