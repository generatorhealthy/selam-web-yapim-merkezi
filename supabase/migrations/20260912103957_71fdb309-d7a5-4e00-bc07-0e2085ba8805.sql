DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts read policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts select policy" ON public.blog_posts;

CREATE POLICY "Blog posts read access" ON public.blog_posts
FOR SELECT
USING (
  status = 'published'
  OR (SELECT public.is_admin_user())
  OR (SELECT public.is_admin_or_staff_user())
  OR author_id = (SELECT auth.uid())
  OR (specialist_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.specialists s
        WHERE s.id = blog_posts.specialist_id AND s.user_id = (SELECT auth.uid())))
  OR (author_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.specialists s
        WHERE s.id = blog_posts.author_id AND s.user_id = (SELECT auth.uid())))
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_created_at
  ON public.blog_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at
  ON public.blog_posts (status, published_at DESC NULLS LAST);