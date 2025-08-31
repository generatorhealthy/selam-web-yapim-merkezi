-- Update the send_appointment_notification_email function to include specialist phone
CREATE OR REPLACE FUNCTION public.send_appointment_notification_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  specialist_data RECORD;
BEGIN
  -- Get specialist information including phone number
  SELECT name, email, phone INTO specialist_data
  FROM specialists 
  WHERE id = NEW.specialist_id;
  
  -- Only send notification for new appointments
  IF TG_OP = 'INSERT' THEN
    -- Call the edge function to send appointment notification with specialist phone
    PERFORM net.http_post(
      url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-appointment-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
      body := jsonb_build_object(
        'appointmentId', NEW.id,
        'patientName', NEW.patient_name,
        'patientEmail', NEW.patient_email,
        'patientPhone', NEW.patient_phone,
        'specialistEmail', COALESCE(specialist_data.email, 'info@doktorumol.com.tr'),
        'specialistName', specialist_data.name,
        'specialistPhone', specialist_data.phone,
        'appointmentDate', NEW.appointment_date,
        'appointmentTime', NEW.appointment_time,
        'appointmentType', NEW.appointment_type,
        'notes', NEW.notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;