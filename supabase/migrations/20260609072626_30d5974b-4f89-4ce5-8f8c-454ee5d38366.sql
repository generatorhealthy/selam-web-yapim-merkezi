DO $$
DECLARE
  v_secret text := '07e465ec6d61a2a5c8d9475ea5151b0ba1cc8f257a3acd2566ac179b6cf1a51c';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs';
  v_base text := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/';
  j RECORD;
BEGIN
  FOR j IN
    SELECT * FROM (VALUES
      (28, 'create-daily-orders'),
      (29, 'retry-failed-iyzico-payments'),
      (30, 'retry-failed-iyzico-payments'),
      (31, 'retry-failed-iyzico-payments'),
      (32, 'retry-failed-iyzico-payments'),
      (53, 'poll-akbank-emails'),
      (54, 'auto-approve-iyzico-orders'),
      (55, 'sync-meta-leads')
    ) AS t(jobid, fn)
  LOOP
    PERFORM cron.alter_job(
      job_id := j.jobid,
      command := format(
        $cmd$  SELECT net.http_post(
    url := %L,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', %L,
      'x-cron-secret', %L
    ),
    body := jsonb_build_object('time', now()::text, 'source', 'cron')
  ) AS request_id;$cmd$,
        v_base || j.fn,
        'Bearer ' || v_anon,
        v_secret
      )
    );
  END LOOP;
END $$;