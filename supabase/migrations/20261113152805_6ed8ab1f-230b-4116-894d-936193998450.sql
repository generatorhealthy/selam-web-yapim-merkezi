CREATE OR REPLACE FUNCTION public.guard_confirmed_offer_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE expected numeric;
BEGIN
  IF coalesce(auth.role()='service_role',false)
    OR (session_user='postgres' AND current_setting('role',true) IN ('none','postgres'))
    OR (auth.uid() IS NOT NULL AND public.is_admin_or_staff_user()) THEN
    RETURN NEW;
  END IF;
  expected := CASE NEW.package_type WHEN 'ozel-firsat' THEN 4000 WHEN 'kayit-linki' THEN 5000 ELSE NULL END;
  IF expected IS NOT NULL AND NEW.amount IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'offer_price_mismatch' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_confirmed_offer_price() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_confirmed_offer_price() TO service_role;
CREATE TRIGGER guard_confirmed_offer_price BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_confirmed_offer_price();