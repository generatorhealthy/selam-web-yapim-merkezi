ALTER TABLE public.client_referrals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_referrals;