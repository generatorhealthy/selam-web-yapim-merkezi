DO $do$
DECLARE
  fn text;
  def text;
  newdef text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'auto_create_invoice_on_approval',
    'notify_specialist_new_appointment',
    'notify_specialist_new_order',
    'notify_specialist_new_review',
    'notify_specialist_new_referral',
    'notify_specialist_new_test_result',
    'send_contract_emails_on_approval'
  ]
  LOOP
    SELECT pg_get_functiondef(p.oid) INTO def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = fn
    LIMIT 1;

    IF def IS NULL THEN CONTINUE; END IF;

    newdef := replace(
      def,
      '''{"Content-Type": "application/json", "Authorization": "Bearer ',
      '''{"Content-Type": "application/json", "x-cron-secret": "07e465ec6d61a2a5c8d9475ea5151b0ba1cc8f257a3acd2566ac179b6cf1a51c", "Authorization": "Bearer '
    );

    IF newdef <> def THEN
      EXECUTE newdef;
    END IF;
  END LOOP;
END
$do$;