-- Fix time arithmetic and naming conflicts in sitemap trigger function
CREATE OR REPLACE FUNCTION public.trigger_sitemap_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_last_trigger TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get the last sitemap generation time (throttle to prevent too frequent updates)
  SELECT created_at INTO v_last_trigger 
  FROM system_settings 
  WHERE setting_key = 'last_sitemap_generation' 
  LIMIT 1;
  
  -- Only trigger if more than 5 minutes have passed since last generation
  IF v_last_trigger IS NULL OR (v_now - v_last_trigger) > INTERVAL '5 minutes' THEN
    -- Call the edge function to generate sitemap
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/generate-sitemap',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := '{"trigger": "content_update"}'::jsonb
    );
    
    -- Update last generation time using the variable to avoid CURRENT_TIME confusion
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES ('last_sitemap_generation', true, 'Last sitemap generation timestamp')
    ON CONFLICT (setting_key)
    DO UPDATE SET 
      created_at = v_now,
      updated_at = v_now;
  END IF;
  
  RETURN NEW;
END;
$function$;