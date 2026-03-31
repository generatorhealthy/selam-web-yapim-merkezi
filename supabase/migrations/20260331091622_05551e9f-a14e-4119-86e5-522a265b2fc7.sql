
CREATE TABLE public.calendar_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid REFERENCES public.specialists(id) ON DELETE CASCADE NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(specialist_id)
);

ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can manage calendar notes"
  ON public.calendar_notes
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff_user())
  WITH CHECK (public.is_admin_or_staff_user());
