CREATE TABLE public.client_referral_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.client_referrals(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_referral_notes TO authenticated;
GRANT ALL ON public.client_referral_notes TO service_role;

ALTER TABLE public.client_referral_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists manage their own referral notes"
ON public.client_referral_notes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = client_referral_notes.specialist_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = client_referral_notes.specialist_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Admin and staff manage referral notes"
ON public.client_referral_notes
FOR ALL
TO authenticated
USING (is_admin_or_staff_user())
WITH CHECK (is_admin_or_staff_user());

CREATE INDEX idx_client_referral_notes_referral ON public.client_referral_notes(referral_id);