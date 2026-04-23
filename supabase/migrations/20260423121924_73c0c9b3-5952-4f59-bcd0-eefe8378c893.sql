-- KVKK uyumlu onay log sistemi
CREATE TABLE IF NOT EXISTS public.user_consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT,
  consent_type TEXT NOT NULL, -- 'disclosure' | 'explicit_consent' | 'marketing_etk'
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  accepted BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  document_hash TEXT,
  source TEXT, -- 'mobile_signup' | 'web_signup' vb.
  metadata JSONB DEFAULT '{}'::jsonb,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_user_id ON public.user_consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_email ON public.user_consent_logs(email);
CREATE INDEX IF NOT EXISTS idx_consent_type ON public.user_consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_accepted_at ON public.user_consent_logs(accepted_at DESC);

ALTER TABLE public.user_consent_logs ENABLE ROW LEVEL SECURITY;

-- Herkes (anon dahil) onay kaydı OLUŞTURABİLİR (kayıt formu sırasında henüz auth yok)
CREATE POLICY "Anyone can insert consent logs"
ON public.user_consent_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Kullanıcı kendi onaylarını görebilir
CREATE POLICY "Users can view their own consent logs"
ON public.user_consent_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = auth.email());

-- Admin/staff tüm logları görebilir (has_role fonksiyonu varsayımıyla)
CREATE POLICY "Admins can view all consent logs"
ON public.user_consent_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
  )
);

-- Onay logları silinemez/değiştirilemez (hukuki ispat için append-only)
-- UPDATE / DELETE policy YOK = engellenir