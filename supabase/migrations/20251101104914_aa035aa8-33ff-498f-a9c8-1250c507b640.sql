-- Enable RLS on blog_posts table
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Published blog posts are publicly viewable" ON blog_posts;
DROP POLICY IF EXISTS "Admin and staff can view all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Specialists can view their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin and staff can manage blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Specialists can create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Specialists can update their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Blog posts select policy" ON blog_posts;
DROP POLICY IF EXISTS "Blog posts insert policy" ON blog_posts;
DROP POLICY IF EXISTS "Blog posts update policy" ON blog_posts;
DROP POLICY IF EXISTS "Blog posts delete policy" ON blog_posts;

-- Create SELECT policy - Public can view published, admins/staff can view all
CREATE POLICY "Blog posts select policy" ON blog_posts
  FOR SELECT
  USING (
    (status = 'published')
    OR
    (is_admin_user() OR is_admin_or_staff_user())
    OR
    (
      specialist_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM specialists s
        WHERE s.id = blog_posts.specialist_id
        AND s.user_id = auth.uid()
      )
    )
    OR
    (
      author_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM specialists s
        WHERE s.id = blog_posts.author_id
        AND s.user_id = auth.uid()
      )
    )
  );

-- Create INSERT policy
CREATE POLICY "Blog posts insert policy" ON blog_posts
  FOR INSERT
  WITH CHECK (
    is_admin_user() 
    OR is_admin_or_staff_user()
    OR EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.user_id = auth.uid()
    )
  );

-- Create UPDATE policy
CREATE POLICY "Blog posts update policy" ON blog_posts
  FOR UPDATE
  USING (
    is_admin_user() 
    OR is_admin_or_staff_user()
    OR (
      specialist_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM specialists s
        WHERE s.id = blog_posts.specialist_id
        AND s.user_id = auth.uid()
      )
    )
    OR (
      author_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM specialists s
        WHERE s.id = blog_posts.author_id
        AND s.user_id = auth.uid()
      )
    )
  );

-- Create DELETE policy - Only admins and staff
CREATE POLICY "Blog posts delete policy" ON blog_posts
  FOR DELETE
  USING (
    is_admin_user() OR is_admin_or_staff_user()
  );