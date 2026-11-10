ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Blog posts insert policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts write policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts update policy" ON public.blog_posts;

CREATE POLICY "Blog posts insert policy" ON public.blog_posts
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_user() OR public.is_admin_or_staff_user()
  OR (
    specialist_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.specialists s WHERE s.id = blog_posts.specialist_id AND s.user_id = auth.uid())
    AND (author_id IS NULL OR author_id = auth.uid() OR author_id = blog_posts.specialist_id)
  )
);

CREATE POLICY "Blog posts update policy" ON public.blog_posts
FOR UPDATE TO authenticated
USING (
  public.is_admin_user() OR public.is_admin_or_staff_user()
  OR ((specialist_id IS NOT NULL) AND EXISTS (SELECT 1 FROM public.specialists s WHERE s.id = blog_posts.specialist_id AND s.user_id = auth.uid()))
  OR ((author_id IS NOT NULL) AND EXISTS (SELECT 1 FROM public.specialists s WHERE s.id = blog_posts.author_id AND s.user_id = auth.uid()))
)
WITH CHECK (
  public.is_admin_user() OR public.is_admin_or_staff_user()
  OR (
    specialist_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.specialists s WHERE s.id = blog_posts.specialist_id AND s.user_id = auth.uid())
    AND (author_id IS NULL OR author_id = auth.uid() OR author_id = blog_posts.specialist_id)
  )
);