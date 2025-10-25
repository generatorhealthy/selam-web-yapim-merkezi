-- Drop existing consolidated policy
DROP POLICY IF EXISTS "Tests consolidated policy" ON public.tests;

-- Create separate policies for better control
CREATE POLICY "Tests insert policy" 
ON public.tests 
FOR INSERT 
WITH CHECK (
  is_admin_user() OR 
  (EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = tests.specialist_id 
    AND s.user_id = auth.uid()
  ))
);

CREATE POLICY "Tests select policy" 
ON public.tests 
FOR SELECT 
USING (
  (is_active = true) OR 
  is_admin_user() OR 
  (EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = tests.specialist_id 
    AND s.user_id = auth.uid()
  ))
);

CREATE POLICY "Tests update policy" 
ON public.tests 
FOR UPDATE 
USING (
  is_admin_user() OR 
  (EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = tests.specialist_id 
    AND s.user_id = auth.uid()
  ))
)
WITH CHECK (
  is_admin_user() OR 
  (EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = tests.specialist_id 
    AND s.user_id = auth.uid()
  ))
);

CREATE POLICY "Tests delete policy" 
ON public.tests 
FOR DELETE 
USING (
  is_admin_user() OR 
  (EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = tests.specialist_id 
    AND s.user_id = auth.uid()
  ))
);