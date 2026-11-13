-- Existing rows, provider subscriptions and public pending order creation are untouched.
CREATE OR REPLACE FUNCTION public.guard_payment_client_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE privileged boolean;
BEGIN
  privileged := COALESCE(auth.role() = 'service_role',false)
    OR (session_user = 'postgres' AND current_setting('role',true) IN ('none','postgres'))
    OR (auth.uid() IS NOT NULL AND CASE WHEN TG_TABLE_NAME='user_profiles' THEN public.is_admin_user() ELSE public.is_admin_or_staff_user() END);
  IF TG_TABLE_NAME = 'user_profiles' THEN
    IF TG_OP = 'INSERT' AND session_user = 'supabase_auth_admin'
      AND current_setting('role',true) IN ('none','supabase_auth_admin')
      AND NEW.role::text IN ('user','specialist','patient') AND NOT COALESCE(NEW.is_approved,false)
      AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))) THEN
      RETURN NEW;
    END IF;
  END IF;
  IF privileged THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'orders' THEN
    IF TG_OP <> 'INSERT' OR COALESCE(NEW.status,'pending') <> 'pending'
      OR NEW.approved_at IS NOT NULL OR NEW.approved_by IS NOT NULL
      OR NEW.payment_transaction_id IS NOT NULL
      OR NEW.subscription_reference_code IS NOT NULL
      OR NEW.iyzico_customer_reference_code IS NOT NULL
      OR COALESCE(NEW.payment_status,'pending') NOT IN ('pending','failed')
      OR COALESCE(NEW.invoice_sent,false) OR NEW.invoice_number IS NOT NULL THEN
      RAISE EXCEPTION 'payment_server_confirmation_required' USING ERRCODE='42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'specialists' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.user_id IS DISTINCT FROM auth.uid() OR auth.uid() IS NULL
        OR COALESCE(NEW.is_active,false)
        OR NEW.registration_source IS DISTINCT FROM 'self_registration'
        OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id=auth.uid() AND lower(trim(u.email))=lower(trim(NEW.email))) THEN
        RAISE EXCEPTION 'specialist_server_identity_required' USING ERRCODE='42501';
      END IF;
    ELSIF NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.registration_source IS DISTINCT FROM OLD.registration_source THEN
      RAISE EXCEPTION 'specialist_privileged_change_required' USING ERRCODE='42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'user_profiles' THEN
    IF TG_OP='INSERT' THEN
      IF NEW.user_id IS DISTINCT FROM auth.uid() OR COALESCE(NEW.is_approved,false)
        OR NEW.role::text NOT IN ('user','specialist','patient') THEN
        RAISE EXCEPTION 'profile_privileged_change_required' USING ERRCODE='42501';
      END IF;
    ELSIF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.role IS DISTINCT FROM OLD.role
      OR NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'profile_privileged_change_required' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_payment_client_writes() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER payment_guard_orders BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_payment_client_writes();
CREATE TRIGGER payment_guard_specialists BEFORE INSERT OR UPDATE ON public.specialists
FOR EACH ROW EXECUTE FUNCTION public.guard_payment_client_writes();
CREATE TRIGGER payment_guard_profiles BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_payment_client_writes();

-- Historical rows remain unchanged; name resemblance never establishes ownership.
CREATE OR REPLACE FUNCTION public.owns_payment_email(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.specialists s WHERE s.user_id=auth.uid()
      AND lower(trim(s.email))=lower(trim(p_email))
      AND NOT EXISTS (SELECT 1 FROM public.specialists other
        WHERE other.user_id IS NOT NULL AND other.user_id<>s.user_id
          AND lower(trim(other.email))=lower(trim(p_email)))
  );
$$;
REVOKE ALL ON FUNCTION public.owns_payment_email(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.owns_payment_email(text) TO service_role;
ALTER POLICY "Specialists can view their own orders" ON public.orders TO authenticated
USING (NOT public.is_admin_or_staff_user() AND status IN ('pending','approved','completed')
  AND EXISTS (SELECT 1 FROM public.specialists s WHERE s.user_id=auth.uid()
    AND lower(trim(s.email))=lower(trim(orders.customer_email))));