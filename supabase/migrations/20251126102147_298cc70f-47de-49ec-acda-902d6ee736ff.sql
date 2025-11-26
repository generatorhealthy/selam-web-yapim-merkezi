-- Add a simple SELECT policy for client_referrals for admin and staff users
-- This allows authenticated users with admin or staff role to read client referral details

-- Drop existing problematic policy if exists
DROP POLICY IF EXISTS "Client referrals access policy" ON public.client_referrals;

-- Create a simple policy that checks user_profiles directly without function
CREATE POLICY "Admin and staff can read client referrals"
ON public.client_referrals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.is_approved = true
    AND user_profiles.role IN ('admin', 'staff')
  )
);

-- Keep the specialists view policy
-- (already exists: "Specialists can view their own referrals")

-- For INSERT/UPDATE/DELETE, we still need admin/staff access
CREATE POLICY "Admin and staff can modify client referrals"
ON public.client_referrals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.is_approved = true
    AND user_profiles.role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.is_approved = true
    AND user_profiles.role IN ('admin', 'staff')
  )
);