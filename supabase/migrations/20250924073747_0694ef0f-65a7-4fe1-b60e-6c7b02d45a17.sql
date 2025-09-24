-- Temporary: drop the BEFORE UPDATE triggers to isolate the source of the time operator error
DROP TRIGGER IF EXISTS update_specialists_updated_at ON public.specialists;
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;