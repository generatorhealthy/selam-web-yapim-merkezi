
-- 1. admin_login_attempts: Login tracking için security definer fonksiyonlar kullanıldığı için
-- bu tabloya doğrudan erişimi sadece admin/staff'a kısıtlayalım
DROP POLICY IF EXISTS "Allow public insert for login tracking" ON public.admin_login_attempts;
DROP POLICY IF EXISTS "Allow public read for login check" ON public.admin_login_attempts;
DROP POLICY IF EXISTS "Allow public update for login tracking" ON public.admin_login_attempts;

-- Login check/record fonksiyonları SECURITY DEFINER olduğu için RLS'i bypass eder
-- Sadece admin okuyabilsin
CREATE POLICY "Admin can read login attempts" ON public.admin_login_attempts
  FOR SELECT TO authenticated USING (public.is_admin_or_staff_user());

-- 2. appointments: Duplicate INSERT politikalarını birleştir
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;

-- Tek bir INSERT politikası (anon kullanıcılar da randevu oluşturabilmeli)
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 3. brevo_email_logs: INSERT politikasını sıkılaştır
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.brevo_email_logs;
CREATE POLICY "Admin and staff can insert email logs" ON public.brevo_email_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_staff_user());

-- 4. form_contents: ALL politikasını ayrıştır
DROP POLICY IF EXISTS "Form contents consolidated policy" ON public.form_contents;
CREATE POLICY "Anyone can read form contents" ON public.form_contents
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can modify form contents" ON public.form_contents
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "Admin can update form contents" ON public.form_contents
  FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "Admin can delete form contents" ON public.form_contents
  FOR DELETE TO authenticated USING (public.is_admin_user());

-- 5. orders: Public INSERT politikasını sıkılaştır
DROP POLICY IF EXISTS "Public insert policy" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 6. specialist_applications: INSERT zaten doğru (anon başvuru yapabilmeli)
-- Sadece uyarı olarak kalır, dokunmuyoruz

-- 7. test_questions: ALL politikasını ayrıştır
DROP POLICY IF EXISTS "Test questions consolidated policy" ON public.test_questions;
CREATE POLICY "Anyone can read test questions" ON public.test_questions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can insert test questions" ON public.test_questions
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin_user() OR EXISTS (
      SELECT 1 FROM tests t JOIN specialists s ON s.id = t.specialist_id 
      WHERE t.id = test_questions.test_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "Admin can update test questions" ON public.test_questions
  FOR UPDATE TO authenticated 
  USING (
    public.is_admin_user() OR EXISTS (
      SELECT 1 FROM tests t JOIN specialists s ON s.id = t.specialist_id 
      WHERE t.id = test_questions.test_id AND s.user_id = auth.uid()
    )
  );

-- 8. test_results: Duplicate SELECT politikasını düzelt
DROP POLICY IF EXISTS "Users can view test results" ON public.test_results;
-- "Test results read policy" zaten admin + specialist kontrolü yapıyor, yeterli

-- Duplicate INSERT politikalarını düzelt
DROP POLICY IF EXISTS "Test results insert policy" ON public.test_results;
-- "Anyone can insert test results" kalıyor (anonim test çözebilmeli)

-- 9. website_analytics: UPDATE politikasını sıkılaştır
DROP POLICY IF EXISTS "Allow analytics tracking updates" ON public.website_analytics;
CREATE POLICY "Allow analytics session updates" ON public.website_analytics
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
