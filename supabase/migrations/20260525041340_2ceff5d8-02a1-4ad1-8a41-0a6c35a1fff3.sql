CREATE TABLE IF NOT EXISTS public.instagram_post_templates (
  key TEXT PRIMARY KEY,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  data_base64 TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_post_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_staff_muhasebe_read_instagram_templates" ON public.instagram_post_templates;

CREATE POLICY "admin_staff_muhasebe_read_instagram_templates"
ON public.instagram_post_templates FOR SELECT
USING (
  auth.role() = 'service_role' OR
  EXISTS (SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','staff','muhasebe'))
);

INSERT INTO public.instagram_post_templates (key, mime_type, data_base64, updated_at)
VALUES ('cover', 'image/jpeg', 'PLACEHOLDER_COVER', now())
ON CONFLICT (key) DO UPDATE SET mime_type = EXCLUDED.mime_type, data_base64 = EXCLUDED.data_base64, updated_at = now();