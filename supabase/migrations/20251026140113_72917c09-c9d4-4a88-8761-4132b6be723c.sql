-- Allow specialists to view their own client referrals
CREATE POLICY "Specialists can view their own referrals"
ON public.client_referrals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s
    WHERE s.id = client_referrals.specialist_id
      AND s.user_id = auth.uid()
  )
);

-- Note: Keep existing admin/staff ALL policy for management actions