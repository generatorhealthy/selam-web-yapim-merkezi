-- ============================================================
-- Otomatik arama motoru bildirim sistemi (IndexNow + Sitemap)
-- ============================================================

-- 1) Notify fonksiyonu — pg_net ile edge function'ı async çağırır
CREATE OR REPLACE FUNCTION public.notify_search_engines_async(
  _type text,
  _id text DEFAULT NULL,
  _slug text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _payload jsonb;
BEGIN
  _payload := jsonb_build_object('type', _type);
  IF _id IS NOT NULL THEN _payload := _payload || jsonb_build_object('id', _id); END IF;
  IF _slug IS NOT NULL THEN _payload := _payload || jsonb_build_object('slug', _slug); END IF;

  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/notify-search-engines',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs'
    ),
    body := _payload,
    timeout_milliseconds := 5000
  );
EXCEPTION WHEN OTHERS THEN
  -- Asla ana işlemi blokla
  RAISE NOTICE 'notify_search_engines_async failed: %', SQLERRM;
END;
$$;

-- 2) blog_posts trigger
CREATE OR REPLACE FUNCTION public.trg_notify_blog_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug) THEN
    PERFORM public.notify_search_engines_async('blog', NEW.id::text, NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS notify_search_engines_blog_posts ON public.blog_posts;
CREATE TRIGGER notify_search_engines_blog_posts
AFTER INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_blog_post();

-- 3) blogs trigger
CREATE OR REPLACE FUNCTION public.trg_notify_blog()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug) THEN
    PERFORM public.notify_search_engines_async('blog', NEW.id::text, NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS notify_search_engines_blogs ON public.blogs;
CREATE TRIGGER notify_search_engines_blogs
AFTER INSERT OR UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_blog();

-- 4) specialists trigger
CREATE OR REPLACE FUNCTION public.trg_notify_specialist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR OLD.is_active IS DISTINCT FROM NEW.is_active OR OLD.slug IS DISTINCT FROM NEW.slug) THEN
    PERFORM public.notify_search_engines_async('specialist', NEW.id::text, NULL);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS notify_search_engines_specialists ON public.specialists;
CREATE TRIGGER notify_search_engines_specialists
AFTER INSERT OR UPDATE ON public.specialists
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_specialist();

-- 5) tests trigger
CREATE OR REPLACE FUNCTION public.trg_notify_test()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active = true AND COALESCE(NEW.status,'published') = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status OR OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    PERFORM public.notify_search_engines_async('test', NEW.id::text, NULL);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS notify_search_engines_tests ON public.tests;
CREATE TRIGGER notify_search_engines_tests
AFTER INSERT OR UPDATE ON public.tests
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_test();