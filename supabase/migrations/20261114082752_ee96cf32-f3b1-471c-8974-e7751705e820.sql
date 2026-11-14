CREATE TABLE public.support_notification_claims (ticket_id uuid PRIMARY KEY REFERENCES public.support_tickets(id) ON DELETE RESTRICT,state text NOT NULL DEFAULT 'sending',created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.support_notification_claims TO service_role;
ALTER TABLE public.support_notification_claims ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.guard_appointment_insert_decision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); effective_role text := coalesce(nullif(current_setting('role',true),'none'),session_user);
BEGIN
IF effective_role='service_role' OR (effective_role IN ('postgres','supabase_admin') AND session_user IN ('postgres','supabase_admin')) OR (session_user IN ('authenticator','postgres','supabase_admin') AND current_setting('request.jwt.claim.role',true)='service_role') THEN RETURN NEW; END IF;
IF uid IS NOT NULL AND (public.is_admin_or_staff_user() OR EXISTS(SELECT 1 FROM public.specialists s WHERE s.id=NEW.specialist_id AND s.user_id=uid)) THEN RETURN NEW; END IF;
IF coalesce(NEW.status,'pending')<>'pending' OR coalesce(NEW.created_by_specialist,false) THEN RAISE EXCEPTION 'appointment_decision_forbidden' USING ERRCODE='42501'; END IF;
IF NEW.patient_user_id IS NOT NULL AND NEW.patient_user_id IS DISTINCT FROM uid THEN RAISE EXCEPTION 'appointment_identity_forbidden' USING ERRCODE='42501'; END IF;
NEW.status:='pending'; NEW.created_by_specialist:=false;
RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_appointment_insert_decision() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER a00_appointment_insert_decision BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_insert_decision();