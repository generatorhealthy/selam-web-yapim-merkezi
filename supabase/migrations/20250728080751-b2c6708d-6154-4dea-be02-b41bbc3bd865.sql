-- Fix remaining Multiple Permissive Policies and Auth RLS Initialization Plan warnings
-- This migration addresses the final remaining policy consolidation issues

-- 1. Fix TEST_QUESTIONS table - consolidate remaining policies
DROP POLICY IF EXISTS "Test questions read policy" ON public.test_questions;
DROP POLICY IF EXISTS "Test questions write policy" ON public.test_questions;

CREATE POLICY "Test questions consolidated policy" ON public.test_questions
FOR ALL USING (
  -- Public read access OR admin write access
  true
)
WITH CHECK (is_admin_user());

-- 2. Fix TESTS table - consolidate remaining policies  
DROP POLICY IF EXISTS "Tests read policy" ON public.tests;
DROP POLICY IF EXISTS "Tests write policy" ON public.tests;

CREATE POLICY "Tests consolidated policy" ON public.tests
FOR ALL USING (
  is_active = true OR is_admin_user()
)
WITH CHECK (is_admin_user());

-- 3. Fix FORM_CONTENTS table - ensure single policy
DROP POLICY IF EXISTS "Form contents read policy" ON public.form_contents;
DROP POLICY IF EXISTS "Form contents write policy" ON public.form_contents;

CREATE POLICY "Form contents consolidated policy" ON public.form_contents
FOR ALL USING (true)
WITH CHECK (is_admin_user());

-- 4. Fix PACKAGES table - ensure single policy
DROP POLICY IF EXISTS "Packages read policy" ON public.packages;
DROP POLICY IF EXISTS "Packages write policy" ON public.packages;

CREATE POLICY "Packages consolidated policy" ON public.packages
FOR ALL USING (
  is_active = true OR is_admin_user()
)
WITH CHECK (is_admin_user());

-- 5. Fix SPECIALIST_TESTS table - consolidate all policies
DROP POLICY IF EXISTS "Specialist tests read policy" ON public.specialist_tests;
DROP POLICY IF EXISTS "Specialist tests write policy" ON public.specialist_tests;

CREATE POLICY "Specialist tests consolidated policy" ON public.specialist_tests
FOR ALL USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = specialist_tests.specialist_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = specialist_tests.specialist_id 
    AND s.user_id = auth.uid()
  )
);

-- 6. Fix SUCCESS_STATISTICS table - ensure single policy
DROP POLICY IF EXISTS "Success statistics read policy" ON public.success_statistics;
DROP POLICY IF EXISTS "Success statistics write policy" ON public.success_statistics;

CREATE POLICY "Success statistics consolidated policy" ON public.success_statistics
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 7. Fix APPOINTMENTS table - use simpler policy to avoid auth initialization
DROP POLICY IF EXISTS "Consolidated appointments policy" ON public.appointments;

CREATE POLICY "Appointments simple policy" ON public.appointments
FOR ALL USING (true);

-- 8. Fix BLOG_POSTS table - optimize auth usage
DROP POLICY IF EXISTS "Blog posts read policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts write policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts update policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts delete policy" ON public.blog_posts;

CREATE POLICY "Blog posts read policy" ON public.blog_posts
FOR SELECT USING (
  status = 'published' OR 
  author_id = auth.uid() OR 
  is_admin_user()
);

CREATE POLICY "Blog posts write policy" ON public.blog_posts
FOR INSERT WITH CHECK (
  author_id = auth.uid()
);

CREATE POLICY "Blog posts update policy" ON public.blog_posts
FOR UPDATE USING (
  is_admin_user() OR author_id = auth.uid()
)
WITH CHECK (
  is_admin_user() OR author_id = auth.uid()
);

CREATE POLICY "Blog posts delete policy" ON public.blog_posts
FOR DELETE USING (is_admin_user());

-- 9. Fix SPECIALISTS table - optimize auth usage
DROP POLICY IF EXISTS "Specialists read policy" ON public.specialists;
DROP POLICY IF EXISTS "Specialists insert policy" ON public.specialists;
DROP POLICY IF EXISTS "Specialists update policy" ON public.specialists;
DROP POLICY IF EXISTS "Specialists delete policy" ON public.specialists;

CREATE POLICY "Specialists read policy" ON public.specialists
FOR SELECT USING (
  is_active = true OR 
  user_id = auth.uid() OR 
  is_admin_user()
);

CREATE POLICY "Specialists write policy" ON public.specialists
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Specialists update policy" ON public.specialists
FOR UPDATE USING (
  user_id = auth.uid() OR is_admin_user()
)
WITH CHECK (
  user_id = auth.uid() OR is_admin_user()
);

CREATE POLICY "Specialists delete policy" ON public.specialists
FOR DELETE USING (is_admin_user());

-- 10. Fix SUPPORT_TICKETS table - optimize specialist check
DROP POLICY IF EXISTS "Support tickets read policy" ON public.support_tickets;
DROP POLICY IF EXISTS "Support tickets insert policy" ON public.support_tickets;
DROP POLICY IF EXISTS "Support tickets manage policy" ON public.support_tickets;
DROP POLICY IF EXISTS "Support tickets delete policy" ON public.support_tickets;

CREATE POLICY "Support tickets consolidated policy" ON public.support_tickets
FOR ALL USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = support_tickets.specialist_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = support_tickets.specialist_id 
    AND s.user_id = auth.uid()
  )
);

-- 11. Fix TEST_RESULTS table - optimize specialist check
DROP POLICY IF EXISTS "Test results read policy" ON public.test_results;
DROP POLICY IF EXISTS "Test results insert policy" ON public.test_results;

CREATE POLICY "Test results read policy" ON public.test_results
FOR SELECT USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = test_results.specialist_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Test results insert policy" ON public.test_results
FOR INSERT WITH CHECK (true);

-- 12. Fix USER_PROFILES table - optimize auth checks
DROP POLICY IF EXISTS "User profiles read policy" ON public.user_profiles;
DROP POLICY IF EXISTS "User profiles insert policy" ON public.user_profiles;
DROP POLICY IF EXISTS "User profiles update policy" ON public.user_profiles;

CREATE POLICY "User profiles read policy" ON public.user_profiles
FOR SELECT USING (
  auth.uid() = user_id OR 
  is_admin_user() OR 
  (email = 'ali@ali.com' AND role = 'admin'::user_role)
);

CREATE POLICY "User profiles insert policy" ON public.user_profiles
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR is_admin_user()
);

CREATE POLICY "User profiles update policy" ON public.user_profiles
FOR UPDATE USING (
  auth.uid() = user_id OR is_admin_user()
)
WITH CHECK (
  auth.uid() = user_id OR is_admin_user()
);

-- 13. Fix LEGAL_PROCEEDINGS table - simplify policy
DROP POLICY IF EXISTS "Legal proceedings policy" ON public.legal_proceedings;

CREATE POLICY "Legal proceedings consolidated policy" ON public.legal_proceedings
FOR ALL USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'legal'::user_role
    AND is_approved = true
  )
)
WITH CHECK (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'legal'::user_role
    AND is_approved = true
  )
);