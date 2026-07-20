
-- ============ PARTNERS ============
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  referral_code text NOT NULL UNIQUE,
  commission_per_signup numeric NOT NULL DEFAULT 1000,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Helper: security definer for admin/staff check reuse
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin','staff')
      AND is_approved = true
  );
$$;

-- Helper: get current user's partner id
CREATE OR REPLACE FUNCTION public.current_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partners WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE POLICY "Admin manages all partners"
  ON public.partners FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "Partner sees own record"
  ON public.partners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============ PARTNER_REFERRALS ============
CREATE TABLE public.partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  specialist_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  specialist_email text NOT NULL,
  specialist_name text,
  specialist_phone text,
  signup_at timestamptz NOT NULL DEFAULT now(),
  first_paid_at timestamptz,
  first_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  commission_amount numeric NOT NULL DEFAULT 1000,
  commission_status text NOT NULL DEFAULT 'pending', -- pending | earned | paid | cancelled
  paid_at timestamptz,
  payment_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, specialist_email)
);

CREATE INDEX idx_partner_referrals_partner ON public.partner_referrals(partner_id);
CREATE INDEX idx_partner_referrals_email ON public.partner_referrals(lower(specialist_email));
CREATE INDEX idx_partner_referrals_status ON public.partner_referrals(commission_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_referrals TO authenticated;
GRANT INSERT ON public.partner_referrals TO anon;  -- signup form inserts referral row
GRANT ALL ON public.partner_referrals TO service_role;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages all referrals"
  ON public.partner_referrals FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "Partner sees own referrals"
  ON public.partner_referrals FOR SELECT TO authenticated
  USING (partner_id = public.current_partner_id());

-- Anyone (including signup form) may INSERT a referral, but only for an active partner code.
-- We enforce via WITH CHECK: partner must exist & be active.
CREATE POLICY "Public may create referral for active partner"
  ON public.partner_referrals FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.is_active = true)
  );

-- ============ PARTNER_COMMISSION_PAYMENTS ============
CREATE TABLE public.partner_commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  payment_method text DEFAULT 'bank_transfer',
  invoice_no text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_payments_partner ON public.partner_commission_payments(partner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_commission_payments TO authenticated;
GRANT ALL ON public.partner_commission_payments TO service_role;
ALTER TABLE public.partner_commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages all payments"
  ON public.partner_commission_payments FOR ALL TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "Partner sees own payments"
  ON public.partner_commission_payments FOR SELECT TO authenticated
  USING (partner_id = public.current_partner_id());

-- ============ TRIGGER: mark referral as earned on first paid order ============
CREATE OR REPLACE FUNCTION public.mark_partner_referral_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('approved','completed')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('approved','completed'))
     AND (COALESCE(NEW.subscription_month,1) = 1 OR NEW.is_first_order = true) THEN

    UPDATE public.partner_referrals
    SET commission_status = 'earned',
        first_paid_at = COALESCE(first_paid_at, NOW()),
        first_order_id = COALESCE(first_order_id, NEW.id),
        updated_at = NOW()
    WHERE commission_status = 'pending'
      AND lower(specialist_email) = lower(NEW.customer_email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_partner_referral_earned ON public.orders;
CREATE TRIGGER trg_mark_partner_referral_earned
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.mark_partner_referral_earned();

-- ============ updated_at trigger reuse ============
CREATE TRIGGER trg_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();

CREATE TRIGGER trg_partner_referrals_updated_at
BEFORE UPDATE ON public.partner_referrals
FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();

-- ============ Seed İzmir Psikoloji Enstitüsü ============
INSERT INTO public.partners (name, referral_code, commission_per_signup, contact_email, notes)
VALUES ('İzmir Psikoloji Enstitüsü', 'IZMIR2026', 1000, NULL, 'INSTITUTUS LLC / İzmir Psikoloji Enstitüsü - Kurumsal İş Ortaklığı ve Karşılıklı Komisyon Sözleşmesi')
ON CONFLICT (referral_code) DO NOTHING;
