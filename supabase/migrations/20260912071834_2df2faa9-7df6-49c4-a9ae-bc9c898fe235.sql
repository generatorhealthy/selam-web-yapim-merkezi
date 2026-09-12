CREATE INDEX IF NOT EXISTS idx_client_referrals_year_specialist_month
ON public.client_referrals (year, specialist_id, month);

CREATE INDEX IF NOT EXISTS idx_client_referrals_specialist_period_status_referred
ON public.client_referrals (specialist_id, year, month, is_referred, referred_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_referrals_referred_recent
ON public.client_referrals (referred_at DESC, specialist_id)
WHERE is_referred = true;

CREATE INDEX IF NOT EXISTS idx_orders_active_created_cursor
ON public.orders (created_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_subscription_month_created
ON public.orders (subscription_month, created_at DESC);