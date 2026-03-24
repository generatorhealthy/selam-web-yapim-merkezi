
-- 1. Duplicate index'i kaldır (website_analytics)
DROP INDEX IF EXISTS public.idx_website_analytics_session_id;

-- 2. blog_posts: Duplicate SELECT politikalarını birleştir
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can read published posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin_or_staff_user());

-- 3. client_referrals: Duplicate politikaları temizle
DROP POLICY IF EXISTS "Admin and staff can view client referrals" ON public.client_referrals;
DROP POLICY IF EXISTS "Staff can view client referrals" ON public.client_referrals;
CREATE POLICY "Admin and staff can view client referrals" ON public.client_referrals
  FOR SELECT TO authenticated USING (public.is_admin_or_staff_user());

-- 4. orders: Duplicate SELECT politikalarını birleştir
DROP POLICY IF EXISTS "Admin read policy" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
CREATE POLICY "Admin can view all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin_or_staff_user());

-- 5. test_questions: Duplicate SELECT politikalarını birleştir  
DROP POLICY IF EXISTS "Anyone can read test questions" ON public.test_questions;
DROP POLICY IF EXISTS "Public can read test questions" ON public.test_questions;
CREATE POLICY "Anyone can read test questions" ON public.test_questions
  FOR SELECT TO anon, authenticated USING (true);
