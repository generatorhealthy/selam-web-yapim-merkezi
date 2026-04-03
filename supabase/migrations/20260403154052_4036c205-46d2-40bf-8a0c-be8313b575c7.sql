-- Önce Ayşe Bulut Barkın'ı manuel olarak automatic_orders'a ekle
INSERT INTO public.automatic_orders (
  customer_name, customer_email, customer_phone, customer_tc_no,
  customer_address, customer_city, customer_type,
  package_name, package_type, amount, payment_method,
  monthly_payment_day, registration_date, total_months,
  current_month, paid_months, is_active
) VALUES (
  'Ayşe  Bulut Barkın', 'aysebulutbarkin@gmail.com', '+905422616954', '39302188420',
  'Araplar mahallesi şehit yaver turan CD okyanus konutları h blok no 61', 'Ankara', 'individual',
  'Premium Paket - Özel Fırsat', 'ozel-firsat', 4000, 'credit_card',
  3, '2026-04-03', 24,
  1, ARRAY[1], true
);

-- Sipariş onaylandığında automatic_orders'a otomatik kayıt oluşturan trigger
CREATE OR REPLACE FUNCTION public.auto_create_customer_on_order_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sadece status 'approved' olduğunda ve ilk sipariş (subscription_month = 1 veya is_first_order = true) olduğunda çalış
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    IF NEW.subscription_month = 1 OR NEW.is_first_order = true THEN
      -- automatic_orders'da bu e-posta ile kayıt yoksa oluştur
      IF NOT EXISTS (SELECT 1 FROM automatic_orders WHERE customer_email = NEW.customer_email) THEN
        INSERT INTO automatic_orders (
          customer_name, customer_email, customer_phone, customer_tc_no,
          customer_address, customer_city, customer_type,
          company_name, company_tax_no, company_tax_office,
          package_name, package_type, amount, payment_method,
          monthly_payment_day, registration_date, total_months,
          current_month, paid_months, is_active
        ) VALUES (
          NEW.customer_name, NEW.customer_email, NEW.customer_phone, NEW.customer_tc_no,
          NEW.customer_address, NEW.customer_city, NEW.customer_type,
          NEW.company_name, NEW.company_tax_no, NEW.company_tax_office,
          NEW.package_name, NEW.package_type, NEW.amount, NEW.payment_method,
          COALESCE((SELECT payment_day FROM specialists WHERE email = NEW.customer_email LIMIT 1), EXTRACT(DAY FROM NOW())::int),
          CURRENT_DATE::text, 24,
          1, ARRAY[1], true
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_customer_on_approval
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_customer_on_order_approval();
