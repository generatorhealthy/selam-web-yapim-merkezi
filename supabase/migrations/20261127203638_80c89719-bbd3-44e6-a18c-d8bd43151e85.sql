CREATE TABLE public.garanti_control_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_order_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  prov_user text NOT NULL,
  status text NOT NULL DEFAULT 'initializing',
  hash_verified boolean NOT NULL DEFAULT false,
  proc_return_code text, md_status text, auth_code text, host_ref text, error_message text,
  refunded_amount numeric NOT NULL DEFAULT 0,
  started_by uuid,
  last_query jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.garanti_control_payments TO authenticated;
GRANT ALL ON public.garanti_control_payments TO service_role;
ALTER TABLE public.garanti_control_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read garanti control payments" ON public.garanti_control_payments FOR SELECT TO authenticated USING (public.is_admin_user());
ALTER TABLE public.garanti_subscriptions ADD COLUMN last_query jsonb, ADD COLUMN last_reconciled_at timestamptz, ADD COLUMN refunded_amount numeric NOT NULL DEFAULT 0, ADD COLUMN recurring_cancel_note text;
CREATE INDEX ON public.garanti_transactions (subscription_id);
CREATE UNIQUE INDEX garanti_transactions_bank_ref_uniq ON public.garanti_transactions (bank_order_id, kind, host_ref) WHERE host_ref IS NOT NULL;