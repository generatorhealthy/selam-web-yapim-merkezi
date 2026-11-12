-- ISOLATED MINIMAL FIXTURE: not a production schema clone or a deployable migration.
-- auth.uid() is supplied by real Supabase, or a separate local test stub.
CREATE TABLE public.specialists(id uuid PRIMARY KEY,user_id uuid,email text,is_active boolean);
GRANT ALL ON public.specialists TO service_role;
GRANT SELECT ON public.specialists TO authenticated;
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_specialist_read ON public.specialists FOR SELECT TO authenticated USING(user_id=auth.uid());

CREATE TABLE public.tests(id uuid PRIMARY KEY,specialist_id uuid REFERENCES public.specialists(id),is_active boolean);
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.specialist_tests(test_id uuid REFERENCES public.tests(id),specialist_id uuid REFERENCES public.specialists(id),is_enabled boolean);
GRANT ALL ON public.specialist_tests TO service_role;
ALTER TABLE public.specialist_tests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.test_questions(id uuid PRIMARY KEY,test_id uuid REFERENCES public.tests(id),question_type text,options jsonb,is_required boolean,step_number int);
GRANT ALL ON public.test_questions TO service_role;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.test_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),test_id uuid REFERENCES public.tests(id),specialist_id uuid REFERENCES public.specialists(id),patient_user_id uuid,patient_name text,patient_email text,answers jsonb,results jsonb,status text);
GRANT ALL ON public.test_results TO service_role;
GRANT SELECT ON public.test_results TO authenticated;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_result_read ON public.test_results FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.specialists s WHERE s.id=test_results.specialist_id AND s.user_id=auth.uid()));

CREATE TABLE public.user_consent_logs(id uuid PRIMARY KEY,user_id uuid,consent_type text,consent_version text,document_hash text,accepted boolean,accepted_at timestamptz,source text,ip_address text,metadata jsonb);
GRANT SELECT,INSERT ON public.user_consent_logs TO service_role;
ALTER TABLE public.user_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.appointments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),specialist_id uuid REFERENCES public.specialists(id),patient_user_id uuid,notes text,consultation_topic text);
GRANT ALL ON public.appointments TO service_role;
GRANT SELECT ON public.appointments TO authenticated;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_appointment_read ON public.appointments FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.specialists s WHERE s.id=appointments.specialist_id AND s.user_id=auth.uid()));

CREATE TABLE public.simulated_deliveries(event_key text PRIMARY KEY,channel text NOT NULL,created_at timestamptz DEFAULT now());
GRANT ALL ON public.simulated_deliveries TO service_role;
ALTER TABLE public.simulated_deliveries ENABLE ROW LEVEL SECURITY;