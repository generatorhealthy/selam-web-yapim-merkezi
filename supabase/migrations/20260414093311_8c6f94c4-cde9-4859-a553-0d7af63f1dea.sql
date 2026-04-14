
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON public.orders USING gin (customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_trgm ON public.orders USING gin (customer_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_package_name_trgm ON public.orders USING gin (package_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone_trgm ON public.orders USING gin (customer_phone gin_trgm_ops);
