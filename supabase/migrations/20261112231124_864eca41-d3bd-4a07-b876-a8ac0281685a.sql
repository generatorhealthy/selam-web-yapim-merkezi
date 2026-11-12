CREATE OR REPLACE FUNCTION public.guard_payment_client_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE privileged boolean;
BEGIN
  privileged := COALESCE(auth.role() = 'service_role',false)
    OR (session_user = 'postgres' AND current_setting('role',true) IN ('none','postgres'))
    OR (auth.uid() IS NOT NULL AND CASE WHEN TG_TABLE_NAME='user_profiles' THEN public.is_admin_user() ELSE public.is_admin_or_staff_user() END);
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