CREATE INDEX IF NOT EXISTS idx_orders_active_status_created_cursor
ON public.orders (status, created_at DESC, id DESC)
WHERE deleted_at IS NULL;