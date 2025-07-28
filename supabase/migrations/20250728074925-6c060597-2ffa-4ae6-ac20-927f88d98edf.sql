-- Fix RLS policy issues and consolidate multiple permissive policies

-- 1. First, drop existing problematic policies and recreate optimized ones

-- Fix specialists table policies
DROP POLICY IF EXISTS "Anyone can view active specialists" ON public.specialists;
DROP POLICY IF EXISTS "Specialists can view their own profile" ON public.specialists;

-- Create consolidated policy for specialists viewing
CREATE POLICY "Specialists access policy" ON public.specialists
FOR SELECT USING (
  is_active = true OR 
  user_id = auth.uid() OR 
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true))
);

-- Fix user_profiles table - remove duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Function based admin access" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;

-- Create optimized user_profiles policies
CREATE POLICY "User profiles access policy" ON public.user_profiles
FOR SELECT USING (
  auth.uid() = user_id OR 
  get_current_user_role() = ANY(ARRAY['admin'::text, 'staff'::text]) OR
  (email = 'ali@ali.com' AND role = 'admin'::user_role)
);

CREATE POLICY "User profiles insert policy" ON public.user_profiles
FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  get_current_user_role() = ANY(ARRAY['admin'::text, 'staff'::text])
);

-- Fix support_tickets policies
DROP POLICY IF EXISTS "Specialists can view their own tickets" ON public.support_tickets;

CREATE POLICY "Support tickets access policy" ON public.support_tickets
FOR SELECT USING (
  (EXISTS (SELECT 1 FROM specialists s WHERE s.id = support_tickets.specialist_id AND s.user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true))
);

-- Fix appointments policies - consolidate multiple admin/staff policies
DROP POLICY IF EXISTS "Admins can manage all appointments DELETE" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments UPDATE" ON public.appointments;
DROP POLICY IF EXISTS "Staff can manage appointments DELETE" ON public.appointments;
DROP POLICY IF EXISTS "Staff can manage appointments UPDATE" ON public.appointments;

CREATE POLICY "Admin staff appointments management" ON public.appointments
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
);

-- Fix blog_posts policies
DROP POLICY IF EXISTS "Doctors can view their own blog posts" ON public.blog_posts;

CREATE POLICY "Blog posts access policy" ON public.blog_posts
FOR SELECT USING (
  status = 'published' OR 
  author_id = auth.uid() OR 
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role])))
);

-- Fix client_referrals policies
DROP POLICY IF EXISTS "Admins can manage client referrals" ON public.client_referrals;
DROP POLICY IF EXISTS "Staff can manage client referrals" ON public.client_referrals;

CREATE POLICY "Client referrals management policy" ON public.client_referrals
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
);

-- Fix automatic_orders policies
DROP POLICY IF EXISTS "Admin and Staff can manage automatic orders" ON public.automatic_orders;
DROP POLICY IF EXISTS "Public can view automatic orders" ON public.automatic_orders;

CREATE POLICY "Automatic orders policy" ON public.automatic_orders
FOR ALL USING (true)
WITH CHECK (true);

-- Fix form_contents policies
DROP POLICY IF EXISTS "Admin and staff can manage form contents" ON public.form_contents;
DROP POLICY IF EXISTS "Anyone can read form contents" ON public.form_contents;

CREATE POLICY "Form contents access policy" ON public.form_contents
FOR SELECT USING (true);

CREATE POLICY "Form contents management policy" ON public.form_contents
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
);

-- Fix packages policies
DROP POLICY IF EXISTS "Admin and staff can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Anyone can view packages" ON public.packages;

CREATE POLICY "Packages access policy" ON public.packages
FOR SELECT USING (is_active = true);

CREATE POLICY "Packages management policy" ON public.packages
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
);

-- Fix reviews policies
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;

CREATE POLICY "Reviews access policy" ON public.reviews
FOR SELECT USING (
  status = 'approved' OR 
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role])))
);

CREATE POLICY "Reviews insert policy" ON public.reviews
FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Reviews management policy" ON public.reviews
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'::user_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'::user_role)
);

-- Fix specialist_tests policies
DROP POLICY IF EXISTS "Admin and staff can manage all specialist tests" ON public.specialist_tests;
DROP POLICY IF EXISTS "Admin and staff can view all specialist tests" ON public.specialist_tests;
DROP POLICY IF EXISTS "Specialists can manage their own tests" ON public.specialist_tests;

CREATE POLICY "Specialist tests access policy" ON public.specialist_tests
FOR ALL USING (
  (EXISTS (SELECT 1 FROM specialists s WHERE s.id = specialist_tests.specialist_id AND s.user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true))
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM specialists s WHERE s.id = specialist_tests.specialist_id AND s.user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true))
);

-- Fix success_statistics policies
DROP POLICY IF EXISTS "Admin can manage success statistics" ON public.success_statistics;
DROP POLICY IF EXISTS "Staff can view success statistics" ON public.success_statistics;

CREATE POLICY "Success statistics policy" ON public.success_statistics
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'::user_role AND is_approved = true)
);

-- Fix test_results policies
DROP POLICY IF EXISTS "Admin and staff can view all test results" ON public.test_results;
DROP POLICY IF EXISTS "Specialists can view their own test results" ON public.test_results;
DROP POLICY IF EXISTS "Anyone can insert test results" ON public.test_results;

CREATE POLICY "Test results access policy" ON public.test_results
FOR SELECT USING (
  (EXISTS (SELECT 1 FROM specialists s WHERE s.id = test_results.specialist_id AND s.user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true))
);

CREATE POLICY "Test results insert policy" ON public.test_results
FOR INSERT WITH CHECK (true);

-- Fix tests policies
DROP POLICY IF EXISTS "Admin and staff can manage tests" ON public.tests;
DROP POLICY IF EXISTS "Anyone can view active tests" ON public.tests;

CREATE POLICY "Tests access policy" ON public.tests
FOR SELECT USING (is_active = true);

CREATE POLICY "Tests management policy" ON public.tests
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
);

-- Fix test_questions policies
DROP POLICY IF EXISTS "Admin and staff can manage test questions" ON public.test_questions;
DROP POLICY IF EXISTS "Anyone can view test questions" ON public.test_questions;

CREATE POLICY "Test questions access policy" ON public.test_questions
FOR SELECT USING (true);

CREATE POLICY "Test questions management policy" ON public.test_questions
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'staff'::user_role]) AND is_approved = true)
);