-- Drop existing trigger first if exists
DROP TRIGGER IF EXISTS send_appointment_notification_email_trigger ON public.appointments;

-- Update the trigger function to send SMS to patient when specialist creates appointment
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
    -- Call the edge function to send appointment notification to specialist with phone
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
    
    -- If appointment is created by specialist and status is pending, send SMS to patient
    IF NEW.created_by_specialist = true AND NEW.status = 'pending' THEN
      PERFORM net.http_post(
        url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-sms-via-static-proxy',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
        body := jsonb_build_object(
          'phone', NEW.patient_phone,
          'message', format(
            'Merhaba %s, %s ile %s tarihinde saat %s''da %s randevunuz mevcuttur. Detaylar için: doktorumol.com.tr',
            NEW.patient_name,
            specialist_data.name,
            TO_CHAR(NEW.appointment_date::date, 'DD.MM.YYYY'),
            NEW.appointment_time,
            CASE 
              WHEN NEW.appointment_type = 'online' THEN 'online'
              WHEN NEW.appointment_type = 'face-to-face' THEN 'yüz yüze'
              ELSE NEW.appointment_type
            END
          )
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER send_appointment_notification_email_trigger
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.send_appointment_notification_email();