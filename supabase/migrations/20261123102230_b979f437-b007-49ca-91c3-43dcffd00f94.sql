CREATE TABLE public.hoppa_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_ref text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  package_name text NOT NULL,
  package_type text,
  monthly_amount numeric NOT NULL CHECK (monthly_amount > 0),
  status text NOT NULL DEFAULT 'initializing',
  card_unique_key text,
  card_masked text,
  paid_months int NOT NULL DEFAULT 0,
  next_charge_at timestamptz,
  failed_attempts int NOT NULL DEFAULT 0,
  last_error text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hoppa_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.hoppa_subscriptions(id) ON DELETE RESTRICT,
  charge_key text NOT NULL UNIQUE,
  order_ref text NOT NULL UNIQUE,
  period int NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_order_id uuid,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hoppa_subscriptions, public.hoppa_charges TO authenticated;
GRANT ALL ON public.hoppa_subscriptions, public.hoppa_charges TO service_role;
ALTER TABLE public.hoppa_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoppa_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read hoppa subscriptions" ON public.hoppa_subscriptions FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE POLICY "Admins read hoppa charges" ON public.hoppa_charges FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE INDEX hoppa_subscriptions_due_idx ON public.hoppa_subscriptions (status, next_charge_at);
CREATE OR REPLACE FUNCTION public.hoppa_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER hoppa_subscriptions_touch BEFORE UPDATE ON public.hoppa_subscriptions FOR EACH ROW EXECUTE FUNCTION public.hoppa_touch_updated_at();
CREATE TRIGGER hoppa_charges_touch BEFORE UPDATE ON public.hoppa_charges FOR EACH ROW EXECUTE FUNCTION public.hoppa_touch_updated_at();