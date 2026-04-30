CREATE TABLE IF NOT EXISTS public.processed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  subject TEXT,
  from_address TEXT,
  result TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_emails_processed_at ON public.processed_emails(processed_at DESC);

ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin muhasebe view processed emails"
ON public.processed_emails FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_profiles up
  WHERE up.user_id = auth.uid() AND up.role IN ('admin','muhasebe','staff')
));