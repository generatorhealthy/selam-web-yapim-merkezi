-- Remove automatic order generation function
DROP FUNCTION IF EXISTS public.generate_monthly_orders();

-- Remove any cron jobs related to automatic order generation
SELECT cron.unschedule('generate-monthly-orders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-monthly-orders');
SELECT cron.unschedule('daily-order-generator') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-order-generator');
SELECT cron.unschedule('automatic-order-generation') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'automatic-order-generation');