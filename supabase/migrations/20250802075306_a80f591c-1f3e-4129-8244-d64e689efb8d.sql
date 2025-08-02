-- Admin kullanıcıları için blogs tablosuna RLS politikaları ekle
DROP POLICY IF EXISTS "Authenticated users can manage blogs" ON blogs;
DROP POLICY IF EXISTS "Blogs are publicly readable" ON blogs;

-- Admin kullanıcıları tüm blog işlemlerini yapabilir
CREATE POLICY "Admin users can manage all blogs" 
ON blogs 
FOR ALL 
USING (is_admin_user() OR is_admin_or_staff_user());

-- Herkes yayınlanmış blogları okuyabilir
CREATE POLICY "Published blogs are publicly readable" 
ON blogs 
FOR SELECT 
USING (status = 'published' OR is_admin_user() OR is_admin_or_staff_user());

-- Admin ve staff kullanıcıları blog oluşturabilir
CREATE POLICY "Admin and staff can create blogs" 
ON blogs 
FOR INSERT 
WITH CHECK (is_admin_user() OR is_admin_or_staff_user());