-- yardimci fonksiyonun search_path'ini sabitle
CREATE OR REPLACE FUNCTION public.client_ip_from_headers()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(btrim(split_part(coalesce(current_setting('request.header.x-forwarded-for', true), ''), ',', 1)), '');
$$;

-- trigger fonksiyonlarinin disaridan (RPC) cagrilmasini engelle
REVOKE EXECUTE ON FUNCTION public.block_appointments_from_blocked_visitors() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_blocked_phone() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_blocked_phone_lead() FROM PUBLIC, anon, authenticated;