-- Update blog posts update policy to include staff users
DROP POLICY IF EXISTS "Blog posts update policy" ON blog_posts;

CREATE POLICY "Blog posts update policy" 
ON blog_posts 
FOR UPDATE 
USING (is_admin_user() OR is_admin_or_staff_user() OR (author_id = auth.uid()))
WITH CHECK (is_admin_user() OR is_admin_or_staff_user() OR (author_id = auth.uid()));