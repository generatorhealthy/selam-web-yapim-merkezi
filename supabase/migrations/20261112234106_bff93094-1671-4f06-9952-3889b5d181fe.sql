CREATE OR REPLACE FUNCTION public.guard_profile_signup_lifecycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF session_user='supabase_auth_admin' AND current_setting('role',true) IN ('none','supabase_auth_admin') AND TG_OP='INSERT'
    AND NEW.role::text IN ('user','specialist','patient') AND NOT COALESCE(NEW.is_approved,false)
    AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))) THEN
   RETURN NEW;
 END IF;
 RETURN public.guard_payment_client_writes();
END $$;
REVOKE ALL ON FUNCTION public.guard_profile_signup_lifecycle() FROM PUBLIC,anon,authenticated;