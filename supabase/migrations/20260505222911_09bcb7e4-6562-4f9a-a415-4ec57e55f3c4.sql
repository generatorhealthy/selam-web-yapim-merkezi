-- Yeni blog yayınlandığında otomatik sosyal medya paylaşımı tetikleyen trigger

CREATE OR REPLACE FUNCTION public.trigger_auto_share_new_blog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/auto-share-new-blog';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs';
BEGIN
  -- Sadece yeni "published" duruma geçen yazılar için tetikle
  -- INSERT: status zaten 'published' ise
  -- UPDATE: status başka bir değerden 'published'e değişiyorsa
  IF (TG_OP = 'INSERT' AND NEW.status = 'published')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status <> 'published'))
  THEN
    PERFORM net.http_post(
      url := fn_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key,
        'apikey', anon_key
      ),
      body := jsonb_build_object('blog_post_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_auto_share_trigger ON public.blog_posts;

CREATE TRIGGER blog_posts_auto_share_trigger
AFTER INSERT OR UPDATE OF status ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_share_new_blog();