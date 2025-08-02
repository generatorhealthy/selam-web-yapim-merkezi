-- Staff üyelerinin blog yazısı oluşturabilmesi için RLS politikasını güncelle
DROP POLICY IF EXISTS "Blog posts write policy" ON blog_posts;

CREATE POLICY "Blog posts write policy" 
ON blog_posts 
FOR INSERT 
WITH CHECK (
  author_id = auth.uid() OR 
  is_admin_user() OR 
  is_admin_or_staff_user()
);