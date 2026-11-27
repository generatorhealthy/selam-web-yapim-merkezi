ALTER TABLE public.garanti_control_payments
  ADD COLUMN IF NOT EXISTS confirmed_failed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_response jsonb,
  ADD COLUMN IF NOT EXISTS refund_result jsonb,
  ADD COLUMN IF NOT EXISTS bank_approval_note text;