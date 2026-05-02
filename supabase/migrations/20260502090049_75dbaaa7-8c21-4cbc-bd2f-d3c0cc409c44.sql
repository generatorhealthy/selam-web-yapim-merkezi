
CREATE TABLE IF NOT EXISTS public.specialist_admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialist_admin_notes_specialist_id 
  ON public.specialist_admin_notes(specialist_id, created_at DESC);

ALTER TABLE public.specialist_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can manage specialist admin notes"
ON public.specialist_admin_notes
FOR ALL
TO authenticated
USING (public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_or_staff_user());

CREATE TRIGGER trg_specialist_admin_notes_updated_at
BEFORE UPDATE ON public.specialist_admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
