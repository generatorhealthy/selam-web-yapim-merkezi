-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the retry-failed-iyzico-payments function to run every 6 hours
SELECT cron.schedule(
  'retry-failed-iyzico-payments',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ywnfnlddpnqfntxmalms.supabase.co/functions/v1/retry-failed-iyzico-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bmZubGRkcG5xZm50eG1hbG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDM0MTcsImV4cCI6MjA1NzYxOTQxN30.P3ySwPqj46t_Yi3ynOKGOJ_J57-xOL1mNJm5s7dOzWk'
    ),
    body := jsonb_build_object('scheduled', true)
  ) AS request_id;
  $$
);