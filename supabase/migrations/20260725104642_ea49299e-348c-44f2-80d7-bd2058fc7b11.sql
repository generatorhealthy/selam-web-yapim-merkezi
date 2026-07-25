
-- Allow anonymous inserts from public re-application form
CREATE POLICY "Anon can insert reapplication leads"
ON public.danisan_basvurulari
FOR INSERT
TO anon
WITH CHECK (source = 'reapply-form' AND status = 'reapplied');

GRANT INSERT ON public.danisan_basvurulari TO anon;
