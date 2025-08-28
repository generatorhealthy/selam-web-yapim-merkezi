-- Add invoice columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS invoice_date timestamptz;

-- Index to quickly filter by invoiced status
CREATE INDEX IF NOT EXISTS idx_orders_invoice_sent ON public.orders(invoice_sent);
