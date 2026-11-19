-- Candidate only. No historical changes and no notification/provider calls.
CREATE TABLE public.appointment_phone_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), phone text NOT NULL, code_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0, verified_at timestamptz, proof_hash text, consumed_at timestamptz
);
GRANT ALL ON public.appointment_phone_challenges TO service_role;
ALTER TABLE public.appointment_phone_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_only ON public.appointment_phone_challenges TO service_role USING(true) WITH CHECK(true);
CREATE TABLE public.appointment_phone_release (id boolean PRIMARY KEY DEFAULT true, enabled boolean NOT NULL DEFAULT false);
GRANT SELECT,UPDATE,INSERT ON public.appointment_phone_release TO service_role;
ALTER TABLE public.appointment_phone_release ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_only ON public.appointment_phone_release TO service_role USING(true) WITH CHECK(true);

CREATE FUNCTION public.appointment_contact_blocked(p_name text,p_email text,p_phone text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM blocked_visitors b WHERE
 (nullif(b.full_name,'') IS NOT NULL AND lower(regexp_replace(btrim(b.full_name),'\s+',' ','g'))=lower(regexp_replace(btrim(p_name),'\s+',' ','g')))
 OR (nullif(b.email,'') IS NOT NULL AND lower(btrim(b.email))=lower(btrim(p_email)))
 OR (nullif(b.phone,'') IS NOT NULL AND normalize_phone_digits(b.phone)=normalize_phone_digits(p_phone)))
$$;

CREATE FUNCTION public.appointment_phone_send(p_id uuid,p_phone text,p_name text,p_email text,p_code_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM appointment_phone_release WHERE enabled) THEN RAISE EXCEPTION 'phone_verification_disabled'; END IF;
 IF p_phone !~ '^905[0-9]{9}$' OR p_code_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid_phone'; END IF;
 IF appointment_contact_blocked(p_name,p_email,p_phone) THEN RAISE EXCEPTION 'blocked_visitor'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_phone,0));
 -- Global cap protects the paid gateway from a distributed number spray.
 PERFORM pg_advisory_xact_lock(hashtextextended('appointment-otp-global',0));
 IF EXISTS(SELECT 1 FROM appointment_phone_challenges WHERE phone=p_phone AND created_at>clock_timestamp()-interval '60 seconds')
 OR (SELECT count(*) FROM appointment_phone_challenges WHERE phone=p_phone AND created_at>clock_timestamp()-interval '1 hour')>=3
 OR (SELECT count(*) FROM appointment_phone_challenges WHERE created_at>clock_timestamp()-interval '1 hour')>=100 THEN
 RAISE EXCEPTION 'phone_retry_later'; END IF;
 INSERT INTO appointment_phone_challenges(id,phone,code_hash,expires_at) VALUES(p_id,p_phone,p_code_hash,clock_timestamp()+interval '5 minutes');
 RETURN p_id;
END $$;

CREATE FUNCTION public.appointment_phone_verify(p_id uuid,p_code_hash text,p_proof_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c appointment_phone_challenges;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM appointment_phone_release WHERE enabled) THEN RETURN false; END IF;
 SELECT * INTO c FROM appointment_phone_challenges WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR c.expires_at<=clock_timestamp() OR c.attempts>=5 OR c.verified_at IS NOT NULL OR c.consumed_at IS NOT NULL THEN RETURN false; END IF;
 UPDATE appointment_phone_challenges SET attempts=attempts+1 WHERE id=p_id;
 IF c.code_hash IS DISTINCT FROM p_code_hash OR p_proof_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
 UPDATE appointment_phone_challenges SET verified_at=clock_timestamp(),proof_hash=p_proof_hash WHERE id=p_id;
 RETURN true;
END $$;

CREATE FUNCTION public.guard_appointment_phone_proof()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); c appointment_phone_challenges; proof text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM appointment_phone_release WHERE enabled) THEN RETURN NEW; END IF;
 -- Only server-validated panel users / owning specialist keep their existing workflow.
 IF uid IS NOT NULL AND (is_admin_or_staff_user() OR EXISTS(SELECT 1 FROM specialists s WHERE s.id=NEW.specialist_id AND s.user_id=uid)) THEN RETURN NEW; END IF;
 proof:=nullif(current_setting('app.appointment_phone_proof',true),'');
 IF proof IS NULL THEN RAISE EXCEPTION 'appointment_phone_verification_required' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM appointment_phone_challenges WHERE proof_hash=proof FOR UPDATE;
 IF NOT FOUND OR c.verified_at IS NULL OR c.expires_at<=clock_timestamp() OR c.consumed_at IS NOT NULL
 OR normalize_phone_digits(NEW.patient_phone)<>normalize_phone_digits(c.phone) THEN
 RAISE EXCEPTION 'appointment_phone_verification_required' USING ERRCODE='42501'; END IF;
 UPDATE appointment_phone_challenges SET consumed_at=clock_timestamp() WHERE id=c.id;
 NEW.created_by_specialist:=false; NEW.status:='pending'; NEW.patient_user_id:=NULL;
 RETURN NEW;
END $$;
CREATE TRIGGER aa_appointment_phone_proof BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION guard_appointment_phone_proof();

CREATE FUNCTION public.appointment_phone_book(p_proof_hash text,p_appointment jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM appointment_phone_release WHERE enabled) THEN RAISE EXCEPTION 'phone_verification_disabled'; END IF;
 IF p_proof_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'appointment_phone_verification_required'; END IF;
 IF length(p_appointment->>'patient_name') NOT BETWEEN 2 AND 100 OR length(p_appointment->>'patient_email') NOT BETWEEN 3 AND 255
 OR (p_appointment->>'patient_phone') !~ '^905[0-9]{9}$' OR (p_appointment->>'appointment_type') NOT IN ('online','face-to-face') THEN RAISE EXCEPTION 'invalid_appointment'; END IF;
 PERFORM set_config('app.appointment_phone_proof',p_proof_hash,true);
 INSERT INTO appointments(id,specialist_id,patient_name,patient_email,patient_phone,appointment_date,appointment_time,appointment_type,status,notes)
 VALUES((p_appointment->>'id')::uuid,(p_appointment->>'specialist_id')::uuid,p_appointment->>'patient_name',p_appointment->>'patient_email',p_appointment->>'patient_phone',
 (p_appointment->>'appointment_date')::date,(p_appointment->>'appointment_time')::time,p_appointment->>'appointment_type','pending',NULL) RETURNING id INTO result;
 PERFORM set_config('app.appointment_phone_proof','',true);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.appointment_contact_blocked(text,text,text),public.appointment_phone_send(uuid,text,text,text,text),public.appointment_phone_verify(uuid,text,text),public.guard_appointment_phone_proof(),public.appointment_phone_book(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.appointment_contact_blocked(text,text,text),public.appointment_phone_send(uuid,text,text,text,text),public.appointment_phone_verify(uuid,text,text),public.guard_appointment_phone_proof(),public.appointment_phone_book(text,jsonb) TO service_role;