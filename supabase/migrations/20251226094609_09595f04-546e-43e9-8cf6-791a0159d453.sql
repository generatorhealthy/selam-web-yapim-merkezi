-- Drop the old insert policy
DROP POLICY IF EXISTS "Specialists can insert appointments" ON public.appointments;

-- Create new policy that allows anyone (including anonymous users) to insert appointments
CREATE POLICY "Anyone can create appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also add a policy for public visitors to create appointments
CREATE POLICY "Public can insert appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);