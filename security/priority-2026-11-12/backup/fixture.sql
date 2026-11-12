-- SYNTHETIC LOCAL DB ONLY. Do not run on Supabase.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE public.test_roles (user_id uuid PRIMARY KEY,role text,approved boolean);
INSERT INTO public.test_roles VALUES ('00000000-0000-4000-8000-000000000001','admin',true),('00000000-0000-4000-8000-000000000002','staff',true),('00000000-0000-4000-8000-000000000003','admin',false);
CREATE FUNCTION public.is_admin_user() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$ SELECT EXISTS(SELECT 1 FROM public.test_roles WHERE user_id=auth.uid() AND role='admin' AND approved) $$;
CREATE TABLE public.database_backups(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,backup_timestamp timestamptz,backup_type text,backup_status text,tables_backed_up text[],total_records integer,created_by uuid,notes text);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['specialists','client_referrals','orders','automatic_orders','appointments','blog_posts','reviews','test_results','tests','test_questions','packages','user_profiles'] LOOP EXECUTE format('CREATE TABLE public.%I(id int PRIMARY KEY, marker text)',t); EXECUTE format('INSERT INTO public.%I VALUES(1,''synthetic-only'')',t); END LOOP; END $$;