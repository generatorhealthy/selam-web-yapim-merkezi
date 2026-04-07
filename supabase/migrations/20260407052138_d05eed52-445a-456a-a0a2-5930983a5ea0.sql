INSERT INTO public.automatic_orders (
  customer_name, customer_email, customer_phone, customer_tc_no,
  customer_address, customer_city, customer_type,
  package_name, package_type, amount, payment_method,
  monthly_payment_day, registration_date, total_months, current_month,
  paid_months, is_active
) VALUES (
  'Yusuf  Harmancı ', 'nyterapi34@gmail.com', '+905521315585', '46336477864',
  'Kadıköy-tuzla-Pendik-maltepe', 'İstanbul', 'individual',
  'Premium Paket - Bu Aya Özel', 'special-offer', 3600, 'credit_card',
  6, '2026-04-06T13:50:42.935771+00:00', 24, 1,
  ARRAY[1]::integer[], true
) ON CONFLICT DO NOTHING;