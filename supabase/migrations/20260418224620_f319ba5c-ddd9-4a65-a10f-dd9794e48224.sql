-- 1) Add 'patient' to user_role enum (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'patient' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'patient';
  END IF;
END $$;

-- 2) patient_profiles table
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  city text,
  birth_date date,
  gender text,
  profile_picture text,
  auth_provider text DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON public.patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_email ON public.patient_profiles(email);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_phone ON public.patient_profiles(phone);

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients view own profile" ON public.patient_profiles;
CREATE POLICY "Patients view own profile" ON public.patient_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients insert own profile" ON public.patient_profiles;
CREATE POLICY "Patients insert own profile" ON public.patient_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients update own profile" ON public.patient_profiles;
CREATE POLICY "Patients update own profile" ON public.patient_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all patient profiles" ON public.patient_profiles;
CREATE POLICY "Admins view all patient profiles" ON public.patient_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin_or_staff_user());

CREATE TRIGGER patient_profiles_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();

-- 3) favorite_specialists table
CREATE TABLE IF NOT EXISTS public.favorite_specialists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialist_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, specialist_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_specialists_user ON public.favorite_specialists(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_specialists_specialist ON public.favorite_specialists(specialist_id);

ALTER TABLE public.favorite_specialists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own favorites" ON public.favorite_specialists;
CREATE POLICY "Users view own favorites" ON public.favorite_specialists
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users add own favorites" ON public.favorite_specialists;
CREATE POLICY "Users add own favorites" ON public.favorite_specialists
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own favorites" ON public.favorite_specialists;
CREATE POLICY "Users delete own favorites" ON public.favorite_specialists
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all favorites" ON public.favorite_specialists;
CREATE POLICY "Admins view all favorites" ON public.favorite_specialists
  FOR SELECT TO authenticated
  USING (public.is_admin_or_staff_user());

-- 4) Link appointments & test_results to patient user accounts
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS patient_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_user_id ON public.appointments(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_email ON public.appointments(patient_email);

DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
CREATE POLICY "Patients view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_user_id 
    OR patient_email = (SELECT email FROM public.patient_profiles WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Patients cancel own appointments" ON public.appointments;
CREATE POLICY "Patients cancel own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = patient_user_id);

ALTER TABLE public.test_results 
  ADD COLUMN IF NOT EXISTS patient_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_test_results_patient_user_id ON public.test_results(patient_user_id);

DROP POLICY IF EXISTS "Patients view own test results" ON public.test_results;
CREATE POLICY "Patients view own test results" ON public.test_results
  FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_user_id
    OR patient_email = (SELECT email FROM public.patient_profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- 5) RPC: Get follower count for a specialist (public)
CREATE OR REPLACE FUNCTION public.get_specialist_follower_count(p_specialist_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint FROM public.favorite_specialists WHERE specialist_id = p_specialist_id;
$$;

-- 6) RPC: Check if current user follows a specialist
CREATE OR REPLACE FUNCTION public.is_following_specialist(p_specialist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.favorite_specialists 
    WHERE specialist_id = p_specialist_id AND user_id = auth.uid()
  );
$$;

-- 7) RPC: Check if a user is a patient (used by login flow to route)
CREATE OR REPLACE FUNCTION public.is_patient_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_profiles WHERE user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_specialist_follower_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_specialist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient_user(uuid) TO authenticated;