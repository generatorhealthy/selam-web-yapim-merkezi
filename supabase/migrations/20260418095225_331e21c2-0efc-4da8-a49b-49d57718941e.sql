
CREATE TABLE IF NOT EXISTS public.urgent_referral_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note TEXT NOT NULL,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.urgent_referral_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can view urgent notes"
ON public.urgent_referral_notes FOR SELECT
TO authenticated
USING (public.is_admin_or_staff_user());

CREATE POLICY "Admin and staff can insert urgent notes"
ON public.urgent_referral_notes FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_staff_user());

CREATE POLICY "Admin and staff can update urgent notes"
ON public.urgent_referral_notes FOR UPDATE
TO authenticated
USING (public.is_admin_or_staff_user());

CREATE POLICY "Admin and staff can delete urgent notes"
ON public.urgent_referral_notes FOR DELETE
TO authenticated
USING (public.is_admin_or_staff_user());

CREATE TRIGGER set_urgent_referral_notes_updated_at
BEFORE UPDATE ON public.urgent_referral_notes
FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();
