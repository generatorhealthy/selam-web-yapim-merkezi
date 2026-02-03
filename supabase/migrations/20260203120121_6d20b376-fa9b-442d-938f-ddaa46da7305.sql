-- Performance indexes for orders table
-- These will speed up search and filtering operations

-- Index for customer name searches (case-insensitive search optimization)
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders(customer_name);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Index for date-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Composite index for common filter combinations (status + date)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);

-- Index for soft-deleted records filter
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON public.orders(deleted_at) WHERE deleted_at IS NULL;

-- Index for package type filtering
CREATE INDEX IF NOT EXISTS idx_orders_package_type ON public.orders(package_type);

-- Index for payment method filtering  
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);