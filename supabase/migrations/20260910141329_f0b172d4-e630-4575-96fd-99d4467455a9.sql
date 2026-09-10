CREATE TABLE public.litigation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  defendant_name text NOT NULL,
  defendant_email text,
  defendant_phone text,
  defendant_tc_no text,
  defendant_address text,
  defendant_city text,
  specialist_id uuid,
  legal_proceeding_id uuid,
  claim_amount numeric NOT NULL DEFAULT 0,
  unpaid_months integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'HAZIRLIK',
  court_name text,
  file_no text,
  contract_pdf_url text,
  invoice_pdf_url text,
  summary text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.litigation_cases TO authenticated;
GRANT ALL ON public.litigation_cases TO service_role;

ALTER TABLE public.litigation_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage litigation cases"
ON public.litigation_cases FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE TABLE public.litigation_evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.litigation_cases(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'DIGER',
  title text NOT NULL,
  description text,
  occurred_at timestamptz,
  file_url text,
  source_ref text,
  importance text NOT NULL DEFAULT 'NORMAL',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_litigation_evidence_case ON public.litigation_evidence_items(case_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.litigation_evidence_items TO authenticated;
GRANT ALL ON public.litigation_evidence_items TO service_role;

ALTER TABLE public.litigation_evidence_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage litigation evidence"
ON public.litigation_evidence_items FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE TRIGGER trg_litigation_cases_updated_at
BEFORE UPDATE ON public.litigation_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_litigation_evidence_updated_at
BEFORE UPDATE ON public.litigation_evidence_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();