CREATE TABLE public.danisan_basvurulari (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  consultation_type TEXT NOT NULL DEFAULT 'online',
  therapy_type TEXT,
  source TEXT,
  lead_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_specialist_id UUID,
  notes TEXT,
  call_attempts INTEGER NOT NULL DEFAULT 0,
  last_called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.danisan_basvurulari TO authenticated;
GRANT ALL ON public.danisan_basvurulari TO service_role;

ALTER TABLE public.danisan_basvurulari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view leads"
ON public.danisan_basvurulari
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert leads"
ON public.danisan_basvurulari
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update leads"
ON public.danisan_basvurulari
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete leads"
ON public.danisan_basvurulari
FOR DELETE
TO authenticated
USING (true);

CREATE INDEX idx_danisan_basvurulari_status ON public.danisan_basvurulari(status);
CREATE INDEX idx_danisan_basvurulari_created_at ON public.danisan_basvurulari(created_at DESC);

CREATE TRIGGER update_danisan_basvurulari_updated_at
BEFORE UPDATE ON public.danisan_basvurulari
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();