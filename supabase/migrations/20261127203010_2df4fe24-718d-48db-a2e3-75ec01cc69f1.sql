CREATE TABLE public.garanti_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  package_providers jsonb NOT NULL DEFAULT '{"expert_os":"hoppa","expert_os_plus":"bank_transfer"}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.garanti_settings (id) VALUES (true);
CREATE TABLE public.garanti_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
  bank_order_id text NOT NULL UNIQUE,
  customer_name text, customer_email text, customer_phone text, package_name text,
  monthly_amount numeric NOT NULL,
  total_payments int NOT NULL DEFAULT 12,
  paid_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'initializing',
  recurring_status text NOT NULL DEFAULT 'none',
  next_charge_at date,
  auth_code text, host_ref text, last_error_code text, last_error text,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.garanti_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.garanti_subscriptions(id) ON DELETE CASCADE,
  bank_order_id text NOT NULL,
  kind text NOT NULL,
  amount numeric,
  success boolean NOT NULL DEFAULT false,
  hash_verified boolean NOT NULL DEFAULT false,
  proc_return_code text, md_status text, auth_code text, host_ref text, error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.garanti_settings, public.garanti_subscriptions, public.garanti_transactions TO authenticated;
GRANT ALL ON public.garanti_settings, public.garanti_subscriptions, public.garanti_transactions TO service_role;
ALTER TABLE public.garanti_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garanti_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garanti_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read garanti settings" ON public.garanti_settings FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE POLICY "Admins read garanti subscriptions" ON public.garanti_subscriptions FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE POLICY "Admins read garanti transactions" ON public.garanti_transactions FOR SELECT TO authenticated USING (public.is_admin_user());