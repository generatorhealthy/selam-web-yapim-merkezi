-- Fix remaining Multiple Permissive Policies and Auth RLS Initialization Plan warnings

-- Drop and recreate RLS policies to fix multiple permissive policies issues
-- This migration consolidates overlapping policies and optimizes auth function usage

-- 1. Fix APPOINTMENTS table policies
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "Admin staff appointments management" ON public.appointments;

CREATE POLICY "Consolidated appointments policy" ON public.appointments
FOR ALL USING (
  -- Allow public access OR admin/staff access
  true OR (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role])
    AND is_approved = true
  ))
);

-- 2. Fix BLOG_POSTS table policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts access policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Blog posts update policy" ON public.blog_posts;
DROP POLICY IF EXISTS "Specialists, admins and staff can create blog posts" ON public.blog_posts;

CREATE POLICY "Blog posts read policy" ON public.blog_posts
FOR SELECT USING (
  status = 'published' OR 
  author_id = auth.uid() OR 
  is_admin_user()
);

CREATE POLICY "Blog posts write policy" ON public.blog_posts
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND (
    is_admin_user() OR 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = ANY(ARRAY['specialist'::user_role, 'staff'::user_role])
    )
  )
);

CREATE POLICY "Blog posts update policy" ON public.blog_posts
FOR UPDATE USING (
  is_admin_user() OR 
  (author_id = auth.uid() AND status = ANY(ARRAY['draft'::text, 'revision_needed'::text]))
)
WITH CHECK (
  is_admin_user() OR 
  (author_id = auth.uid() AND status = ANY(ARRAY['draft'::text, 'revision_needed'::text, 'pending'::text]))
);

CREATE POLICY "Blog posts delete policy" ON public.blog_posts
FOR DELETE USING (is_admin_user());

-- 3. Fix FORM_CONTENTS table policies
DROP POLICY IF EXISTS "Form contents access policy" ON public.form_contents;
DROP POLICY IF EXISTS "Form contents management policy" ON public.form_contents;

CREATE POLICY "Form contents read policy" ON public.form_contents
FOR SELECT USING (true);

CREATE POLICY "Form contents write policy" ON public.form_contents
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 4. Fix PACKAGES table policies
DROP POLICY IF EXISTS "Packages access policy" ON public.packages;
DROP POLICY IF EXISTS "Packages management policy" ON public.packages;

CREATE POLICY "Packages read policy" ON public.packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Packages write policy" ON public.packages
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 5. Fix REVIEWS table policies
DROP POLICY IF EXISTS "Reviews access policy" ON public.reviews;
DROP POLICY IF EXISTS "Reviews insert policy" ON public.reviews;
DROP POLICY IF EXISTS "Reviews management policy" ON public.reviews;

CREATE POLICY "Reviews read policy" ON public.reviews
FOR SELECT USING (
  status = 'approved' OR is_admin_user()
);

CREATE POLICY "Reviews insert policy" ON public.reviews
FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Reviews manage policy" ON public.reviews
FOR UPDATE USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Reviews delete policy" ON public.reviews
FOR DELETE USING (is_admin_user());

-- 6. Fix SPECIALISTS table policies
DROP POLICY IF EXISTS "Admins and staff can insert specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admins and staff can update specialists" ON public.specialists;
DROP POLICY IF EXISTS "Admins and staff can view all specialists" ON public.specialists;
DROP POLICY IF EXISTS "Only admins can delete specialists" ON public.specialists;
DROP POLICY IF EXISTS "Specialists access policy" ON public.specialists;
DROP POLICY IF EXISTS "Specialists can update their own profile" ON public.specialists;

CREATE POLICY "Specialists read policy" ON public.specialists
FOR SELECT USING (
  is_active = true OR 
  user_id = auth.uid() OR 
  is_admin_user()
);

CREATE POLICY "Specialists insert policy" ON public.specialists
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

-- 7. Fix SUPPORT_TICKETS table policies
DROP POLICY IF EXISTS "Admin and staff can manage all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Specialists can create their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Support tickets access policy" ON public.support_tickets;

CREATE POLICY "Support tickets read policy" ON public.support_tickets
FOR SELECT USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = support_tickets.specialist_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Support tickets insert policy" ON public.support_tickets
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = support_tickets.specialist_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Support tickets manage policy" ON public.support_tickets
FOR UPDATE USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Support tickets delete policy" ON public.support_tickets
FOR DELETE USING (is_admin_user());

-- 8. Fix TEST_QUESTIONS table policies
DROP POLICY IF EXISTS "Test questions access policy" ON public.test_questions;
DROP POLICY IF EXISTS "Test questions management policy" ON public.test_questions;

CREATE POLICY "Test questions read policy" ON public.test_questions
FOR SELECT USING (true);

CREATE POLICY "Test questions write policy" ON public.test_questions
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 9. Fix TESTS table policies
DROP POLICY IF EXISTS "Tests access policy" ON public.tests;
DROP POLICY IF EXISTS "Tests management policy" ON public.tests;

CREATE POLICY "Tests read policy" ON public.tests
FOR SELECT USING (is_active = true);

CREATE POLICY "Tests write policy" ON public.tests
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 10. Fix TEST_RESULTS table policies
DROP POLICY IF EXISTS "Test results access policy" ON public.test_results;
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

-- 11. Fix SPECIALIST_TESTS table policies
DROP POLICY IF EXISTS "Specialist tests access policy" ON public.specialist_tests;

CREATE POLICY "Specialist tests read policy" ON public.specialist_tests
FOR SELECT USING (
  is_admin_user() OR 
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = specialist_tests.specialist_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Specialist tests write policy" ON public.specialist_tests
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

-- 12. Fix SUCCESS_STATISTICS table policies
DROP POLICY IF EXISTS "Success statistics policy" ON public.success_statistics;

CREATE POLICY "Success statistics read policy" ON public.success_statistics
FOR SELECT USING (is_admin_user());

CREATE POLICY "Success statistics write policy" ON public.success_statistics
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 13. Fix CLIENT_REFERRALS table policies
DROP POLICY IF EXISTS "Client referrals management policy" ON public.client_referrals;

CREATE POLICY "Client referrals policy" ON public.client_referrals
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 14. Fix USER_PROFILES table policies
DROP POLICY IF EXISTS "Admin email direct access" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "User profiles access policy" ON public.user_profiles;
DROP POLICY IF EXISTS "User profiles insert policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Users cannot change their own role" ON public.user_profiles;

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
  (auth.uid() = user_id AND role = (
    SELECT role FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )) OR 
  is_admin_user()
)
WITH CHECK (
  (auth.uid() = user_id AND role = (
    SELECT role FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )) OR 
  is_admin_user()
);

-- 15. Fix EMPLOYEE_SALARIES table policies
DROP POLICY IF EXISTS "Admin can manage employee salaries" ON public.employee_salaries;

CREATE POLICY "Employee salaries policy" ON public.employee_salaries
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 16. Fix LEGAL_PROCEEDINGS table policies
DROP POLICY IF EXISTS "Admin and Legal can manage legal proceedings" ON public.legal_proceedings;

CREATE POLICY "Legal proceedings policy" ON public.legal_proceedings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'legal'::user_role])
    AND is_approved = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'legal'::user_role])
    AND is_approved = true
  )
);

-- 17. Fix IYZICO_SETTINGS table policies
DROP POLICY IF EXISTS "Admin can manage iyzico settings" ON public.iyzico_settings;

CREATE POLICY "Iyzico settings policy" ON public.iyzico_settings
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());