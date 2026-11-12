"""Minimal synthetic PostgreSQL only. Never reads production connection settings."""
import subprocess, pathlib
ROOT=pathlib.Path(__file__).parent
CMD=['psql','-h','/tmp/dko-payment-pg/socket','-p','55441','-U','postgres','-d','postgres','-X','-v','ON_ERROR_STOP=1','-Atc']
def sql(q):
 r=subprocess.run(CMD+[q],capture_output=True,text=True)
 if r.returncode: raise AssertionError(r.stderr)
 return r.stdout.strip()
sql('''CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
CREATE TABLE auth.users(id uuid primary key,email text);
CREATE TABLE public.user_profiles(user_id uuid,role text,is_approved boolean default false,email text);
CREATE FUNCTION public.is_admin_or_staff_user() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=auth.uid() AND role IN ('admin','staff') AND is_approved)$$;
CREATE FUNCTION public.is_admin_user() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=auth.uid() AND role='admin' AND is_approved)$$;
CREATE TABLE public.specialists(id uuid default gen_random_uuid(),user_id uuid,email text,name text,is_active boolean default false,registration_source text);
CREATE TABLE public.orders(id uuid primary key default gen_random_uuid(),customer_email text,status text default 'pending',approved_at timestamptz,approved_by uuid,payment_transaction_id text,subscription_reference_code text,iyzico_customer_reference_code text,payment_status text,invoice_sent boolean default false,invoice_number text);
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT ALL ON public.orders,public.specialists,public.user_profiles TO anon,authenticated,service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Specialists can view their own orders" ON public.orders FOR SELECT TO authenticated USING(true);
CREATE POLICY pending_insert ON public.orders FOR INSERT TO anon,authenticated WITH CHECK(true);
INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111','one@example.invalid'),('22222222-2222-4222-8222-222222222222','two@example.invalid');
INSERT INTO public.user_profiles(user_id,role,is_approved) VALUES ('11111111-1111-4111-8111-111111111111','specialist',false),('22222222-2222-4222-8222-222222222222','specialist',false);
INSERT INTO public.specialists(user_id,email,name,registration_source) VALUES ('11111111-1111-4111-8111-111111111111','one@example.invalid','Same Name','self_registration'),('22222222-2222-4222-8222-222222222222','two@example.invalid','Same Name','self_registration');
INSERT INTO public.orders(customer_email) VALUES ('one@example.invalid'),('two@example.invalid');''')
sql(ROOT.joinpath('client-boundary.sql').read_text())
def session(role,sub,q):
 return f"SET ROLE {role}; SET request.jwt.claim.role='{role}'; SET request.jwt.claim.sub='{sub}'; "+q
def rejects(label,q):
 r=subprocess.run(CMD+[q],capture_output=True,text=True)
 assert r.returncode and '42501' not in r.stdout and ('required' in r.stderr), (label,r.stderr)
 print('PASS',label)
rejects('anonymous forged paid INSERT',session('anon','',"INSERT INTO public.orders(customer_email,status) VALUES('one@example.invalid','approved')"))
rejects('anonymous success flag',session('anon','',"INSERT INTO public.orders(customer_email,payment_status) VALUES('one@example.invalid','success')"))
sql(session('anon','',"INSERT INTO public.orders(customer_email) VALUES('guest@example.invalid')"));print('PASS legacy guest pending insert')
one='11111111-1111-4111-8111-111111111111'
rejects('specialist self approval',session('authenticated',one,"UPDATE public.user_profiles SET role='admin',is_approved=true WHERE user_id=auth.uid()"))
rejects('direct membership activation',session('authenticated',one,"UPDATE public.specialists SET is_active=true WHERE user_id=auth.uid()"))
rejects('identity reassignment',session('authenticated',one,"UPDATE public.specialists SET email='two@example.invalid' WHERE user_id=auth.uid()"))
assert sql(session('authenticated',one,"SELECT count(*) FROM public.orders" )).splitlines()[-1]=='1';print('PASS same name cannot read other order')
sql(session('authenticated',one,"UPDATE public.specialists SET name='Updated' WHERE user_id=auth.uid()"));print('PASS normal profile editing')
sql(session('service_role','',"UPDATE public.specialists SET is_active=true WHERE email='one@example.invalid'"));print('PASS trusted activation')
sql("INSERT INTO public.user_profiles(user_id,role,is_approved) VALUES('33333333-3333-4333-8333-333333333333','admin',true)")
sql(session('authenticated','33333333-3333-4333-8333-333333333333',"INSERT INTO public.orders(customer_email,status) VALUES('manual@example.invalid','approved')"));print('PASS authorized manual EFT approval')
sql("INSERT INTO public.user_profiles(user_id,role,is_approved) VALUES('44444444-4444-4444-8444-444444444444','staff',true)")
rejects('staff cannot promote self to admin',session('authenticated','44444444-4444-4444-8444-444444444444',"UPDATE public.user_profiles SET role='admin' WHERE user_id=auth.uid()"))
sql("CREATE ROLE supabase_auth_admin; GRANT ALL ON public.user_profiles TO supabase_auth_admin; GRANT USAGE ON SCHEMA public,auth TO supabase_auth_admin")
assert sql("SET SESSION AUTHORIZATION supabase_auth_admin; SET request.jwt.claim.role=''; INSERT INTO public.user_profiles(user_id,role,is_approved,email) VALUES('11111111-1111-4111-8111-111111111111','specialist',false,'one@example.invalid'); SELECT count(*) FROM public.user_profiles WHERE email='one@example.invalid'").splitlines()[-1]=='1'
print('PASS server auth lifecycle creates only verified unapproved profile')