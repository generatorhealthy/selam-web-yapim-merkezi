ALTER TABLE public.support_notification_claims DROP CONSTRAINT support_notification_claims_ticket_id_fkey;
ALTER TABLE public.support_notification_claims ADD CONSTRAINT support_notification_claims_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;

DO $do$
DECLARE d text; n text;
BEGIN
  d := pg_get_functiondef('public.send_appointment_notification_email()'::regprocedure);
  n := regexp_replace(d,
    '(send-sms-via-static-proxy'',\s*headers := ''\{"Content-Type": "application/json", )',
    '\1"x-cron-secret": "07e465ec6d61a2a5c8d9475ea5151b0ba1cc8f257a3acd2566ac179b6cf1a51c", ');
  IF n = d THEN RAISE EXCEPTION 'sms header pattern not found'; END IF;
  EXECUTE n;
END $do$;