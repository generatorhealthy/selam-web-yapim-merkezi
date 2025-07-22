-- Add deleted_at column to orders table for soft delete functionality
ALTER TABLE public.orders 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index on deleted_at column for better query performance
CREATE INDEX idx_orders_deleted_at ON public.orders(deleted_at);

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.orders.deleted_at IS 'Timestamp when order was soft deleted. NULL means active order.';