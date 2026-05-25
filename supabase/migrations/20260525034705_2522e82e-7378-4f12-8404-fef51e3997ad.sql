
-- 1) Table
CREATE TABLE IF NOT EXISTS public.specialist_instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  cover_url TEXT,
  about_url TEXT,
  expertise_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (specialist_id)
);

CREATE INDEX IF NOT EXISTS idx_sip_status ON public.specialist_instagram_posts(status);
CREATE INDEX IF NOT EXISTS idx_sip_created ON public.specialist_instagram_posts(created_at DESC);

ALTER TABLE public.specialist_instagram_posts ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE TRIGGER trg_sip_updated_at
BEFORE UPDATE ON public.specialist_instagram_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: admin/staff/muhasebe full access
CREATE POLICY "admin_staff_muhasebe_select_sip"
ON public.specialist_instagram_posts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','staff','muhasebe'))
);

CREATE POLICY "admin_staff_muhasebe_insert_sip"
ON public.specialist_instagram_posts FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','staff','muhasebe'))
);

CREATE POLICY "admin_staff_muhasebe_update_sip"
ON public.specialist_instagram_posts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','staff','muhasebe'))
);

CREATE POLICY "admin_staff_muhasebe_delete_sip"
ON public.specialist_instagram_posts FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','staff','muhasebe'))
);

-- 2) Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('instagram-posts', 'instagram-posts', true, 5242880, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

CREATE POLICY "public_read_instagram_posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'instagram-posts');

CREATE POLICY "service_write_instagram_posts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instagram-posts' AND (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('admin','staff','muhasebe'))
  )
);

CREATE POLICY "service_update_instagram_posts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instagram-posts' AND (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('admin','staff','muhasebe'))
  )
);

CREATE POLICY "service_delete_instagram_posts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instagram-posts' AND (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('admin','staff','muhasebe'))
  )
);

-- 3) Trigger: auto-generate when specialist becomes active
CREATE OR REPLACE FUNCTION public.trigger_generate_instagram_posts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_key TEXT;
  fn_url TEXT := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/generate-specialist-instagram-posts';
BEGIN
  -- only when becoming active
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active IS TRUE THEN
    RETURN NEW;
  END IF;

  -- skip if already ready
  IF EXISTS (
    SELECT 1 FROM public.specialist_instagram_posts
    WHERE specialist_id = NEW.id AND status = 'ready'
  ) THEN
    RETURN NEW;
  END IF;

  -- insert pending row
  INSERT INTO public.specialist_instagram_posts (specialist_id, status)
  VALUES (NEW.id, 'pending')
  ON CONFLICT (specialist_id) DO UPDATE SET status = 'pending', error_message = NULL;

  -- fire-and-forget edge function (via pg_net if available)
  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('specialistId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_net not available or failed; admin can retry from UI
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_specialist_instagram_posts ON public.specialists;
CREATE TRIGGER trg_specialist_instagram_posts
AFTER INSERT OR UPDATE OF is_active ON public.specialists
FOR EACH ROW EXECUTE FUNCTION public.trigger_generate_instagram_posts();
