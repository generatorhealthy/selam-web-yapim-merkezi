-- Kariyer başvuruları tablosu
CREATE TABLE public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  position text NOT NULL DEFAULT 'Müşteri Temsilcisi',
  cover_letter text,
  cv_filename text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Herkes başvuru oluşturabilir
CREATE POLICY "Anyone can submit career applications"
  ON public.career_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin/staff görüntüleyebilir
CREATE POLICY "Admin/staff can view career applications"
  ON public.career_applications FOR SELECT
  TO authenticated
  USING (public.is_admin_or_staff_user());

-- Admin/staff güncelleyebilir
CREATE POLICY "Admin/staff can update career applications"
  ON public.career_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_staff_user());

-- Admin/staff silebilir
CREATE POLICY "Admin/staff can delete career applications"
  ON public.career_applications FOR DELETE
  TO authenticated
  USING (public.is_admin_or_staff_user());

-- updated_at trigger
CREATE TRIGGER update_career_applications_updated_at
  BEFORE UPDATE ON public.career_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.safe_timestamp_update();

CREATE INDEX idx_career_applications_status ON public.career_applications(status);
CREATE INDEX idx_career_applications_created_at ON public.career_applications(created_at DESC);