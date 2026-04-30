-- Drop duplicate trigger that calls the same edge function as send_appointment_notification_email_trigger
DROP TRIGGER IF EXISTS trigger_send_appointment_notification ON public.appointments;