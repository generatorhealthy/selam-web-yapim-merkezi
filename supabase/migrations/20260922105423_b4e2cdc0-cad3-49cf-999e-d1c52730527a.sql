CREATE OR REPLACE FUNCTION public.protect_user_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  -- Server-side / service role contexts have no auth.uid(); let them through
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  is_privileged := public.is_admin_or_staff_user();

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NULL OR NEW.role::text IN ('admin', 'staff', 'legal', 'muhasebe') THEN
      NEW.role := 'specialist'::public.user_role;
    END IF;
    NEW.is_approved := false;
    RETURN NEW;
  END IF;

  -- UPDATE by a non-privileged user: role and approval are immutable
  NEW.role := OLD.role;
  NEW.is_approved := OLD.is_approved;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_privileges_trigger ON public.user_profiles;

CREATE TRIGGER protect_user_profile_privileges_trigger
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_profile_privileges();