CREATE TABLE public.appointment_notification_authority (
 appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
 token_hash text NOT NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.appointment_notification_authority TO service_role;
ALTER TABLE public.appointment_notification_authority ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_appointment_notification_authority(p_appointment_id uuid,p_token_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'server required' USING ERRCODE='42501';
 END IF;
 RETURN EXISTS(SELECT 1 FROM public.appointment_notification_authority
  WHERE appointment_id=p_appointment_id AND token_hash=p_token_hash AND expires_at>now());
END $$;
REVOKE ALL ON FUNCTION public.verify_appointment_notification_authority(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_appointment_notification_authority(uuid,text) TO service_role;

-- Preserve every existing call (including specialist-created patient SMS). Only add
-- the server-generated credential to this trigger's notification body, never to clients.
DO $patch$
DECLARE original text; replacement text;
BEGIN
 original := pg_get_functiondef('public.send_appointment_notification_email()'::regprocedure);
 IF position('specialist_data RECORD;' in original)=0
 OR position('''appointmentId'', NEW.id,' in original)=0
 OR position('IF TG_OP = ''INSERT'' THEN' in original)=0 THEN
  RAISE EXCEPTION 'appointment trigger definition changed; migration aborted';
 END IF;
 replacement := replace(original,'specialist_data RECORD;', 'specialist_data RECORD; notification_token text;');
 replacement := replace(replacement,'IF TG_OP = ''INSERT'' THEN',
 'IF TG_OP = ''INSERT'' THEN
 notification_token := replace(gen_random_uuid()::text,''-'','''') || replace(gen_random_uuid()::text,''-'','''');
 INSERT INTO public.appointment_notification_authority(appointment_id,token_hash,expires_at)
 VALUES(NEW.id,encode(extensions.digest(notification_token,''sha256''),''hex''),now()+interval ''24 hours'');');
 replacement := replace(replacement,'''appointmentId'', NEW.id,',
 '''appointmentId'', NEW.id, ''notificationToken'', notification_token,');
 EXECUTE replacement;
END $patch$;