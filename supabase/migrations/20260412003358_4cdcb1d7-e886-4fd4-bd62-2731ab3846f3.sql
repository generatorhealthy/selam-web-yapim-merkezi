
-- Only service role can access otp_codes (edge functions use service role)
CREATE POLICY "No public access to otp_codes"
ON public.otp_codes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
