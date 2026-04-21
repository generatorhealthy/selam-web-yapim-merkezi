CREATE TABLE IF NOT EXISTS public.face_to_face_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  referral_count INTEGER NOT NULL DEFAULT 0,
  last_updated_by UUID,
  last_updated_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(specialist_id)
);

CREATE INDEX IF NOT EXISTS idx_f2f_referrals_specialist ON public.face_to_face_referrals(specialist_id);

ALTER TABLE public.face_to_face_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can view face to face referrals"
ON public.face_to_face_referrals FOR SELECT
TO authenticated
USING (public.is_admin_or_staff_user());

CREATE POLICY "Admin and staff can insert face to face referrals"
ON public.face_to_face_referrals FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_staff_user());

CREATE POLICY "Admin and staff can update face to face referrals"
ON public.face_to_face_referrals FOR UPDATE
TO authenticated
USING (public.is_admin_or_staff_user());

CREATE POLICY "Admin and staff can delete face to face referrals"
ON public.face_to_face_referrals FOR DELETE
TO authenticated
USING (public.is_admin_or_staff_user());

CREATE TRIGGER update_f2f_referrals_updated_at
BEFORE UPDATE ON public.face_to_face_referrals
FOR EACH ROW
EXECUTE FUNCTION public.safe_timestamp_update();