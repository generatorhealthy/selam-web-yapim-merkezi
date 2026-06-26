CREATE TABLE public.uzman_basvurulari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text,
  full_name text NOT NULL,
  phone text NOT NULL,
  branch text,
  source text,
  lead_date timestamptz,
  status text NOT NULL DEFAULT 'new',
  notes text,
  call_attempts integer NOT NULL DEFAULT 0,
  last_called_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.uzman_basvurulari TO authenticated;
GRANT ALL ON public.uzman_basvurulari TO service_role;

ALTER TABLE public.uzman_basvurulari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin staff can view uzman leads" ON public.uzman_basvurulari
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role]) AND user_profiles.is_approved = true));

CREATE POLICY "Admin staff can insert uzman leads" ON public.uzman_basvurulari
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role]) AND user_profiles.is_approved = true));

CREATE POLICY "Admin staff can update uzman leads" ON public.uzman_basvurulari
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role]) AND user_profiles.is_approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role]) AND user_profiles.is_approved = true));

CREATE POLICY "Admin staff can delete uzman leads" ON public.uzman_basvurulari
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role]) AND user_profiles.is_approved = true));

CREATE UNIQUE INDEX uzman_basvurulari_external_id_key ON public.uzman_basvurulari (external_id) WHERE external_id IS NOT NULL;