
CREATE TABLE public.bank_transfer_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_name_normalized TEXT NOT NULL,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'TRY',
  raw_subject TEXT,
  raw_body TEXT,
  raw_from TEXT,
  transfer_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  matched_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  matched_at TIMESTAMPTZ,
  matched_by UUID,
  match_method TEXT,
  match_candidates JSONB,
  amount_diff NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_btn_status ON public.bank_transfer_notifications(status);
CREATE INDEX idx_btn_sender_normalized ON public.bank_transfer_notifications(sender_name_normalized);
CREATE INDEX idx_btn_created_at ON public.bank_transfer_notifications(created_at DESC);
CREATE INDEX idx_btn_matched_order ON public.bank_transfer_notifications(matched_order_id);

ALTER TABLE public.bank_transfer_notifications ENABLE ROW LEVEL SECURITY;

-- Admin / staff / muhasebe görebilir
CREATE POLICY "Admin staff muhasebe view bank transfer notifications"
ON public.bank_transfer_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','staff','muhasebe')
  )
);

-- Admin ve muhasebe güncelleyebilir
CREATE POLICY "Admin muhasebe update bank transfer notifications"
ON public.bank_transfer_notifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','muhasebe')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role IN ('admin','muhasebe')
  )
);

-- Admin silebilir
CREATE POLICY "Admin delete bank transfer notifications"
ON public.bank_transfer_notifications
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
  )
);

-- Updated_at trigger
CREATE TRIGGER update_bank_transfer_notifications_updated_at
BEFORE UPDATE ON public.bank_transfer_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
