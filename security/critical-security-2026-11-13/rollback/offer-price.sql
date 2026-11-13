-- Offline rollback only. Does not change any existing order; separate approval required.
DROP TRIGGER IF EXISTS guard_confirmed_offer_price ON public.orders;
DROP FUNCTION IF EXISTS public.guard_confirmed_offer_price();