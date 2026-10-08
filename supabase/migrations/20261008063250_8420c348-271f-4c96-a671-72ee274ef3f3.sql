CREATE TABLE public.lead_qualification_history (
  user_id uuid PRIMARY KEY,
  qualified_at timestamptz,
  qualified_at_precision text NOT NULL CHECK (qualified_at_precision IN ('event_timestamp','profile_timestamp','unknown')),
  score_at_qualification integer,
  threshold integer NOT NULL,
  rule_version text NOT NULL,
  trigger_event text,
  first_paid_at timestamptz,
  decision text NOT NULL CHECK (decision IN ('SEND','SUPPRESSED_POST_PAYMENT','UNDETERMINED_PAID','LEGACY_ALREADY_SENT','TOO_OLD_FOR_META')),
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lead_qualification_history TO authenticated;
GRANT ALL ON public.lead_qualification_history TO service_role;
ALTER TABLE public.lead_qualification_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read qualification history" ON public.lead_qualification_history
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles x WHERE x.user_id = auth.uid() AND x.role = 'admin'));

-- Kayıt bir kez yazılır; kural değişse bile eski eşik zamanı yeniden yazılamaz
CREATE OR REPLACE FUNCTION public.lead_qualification_history_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'lead_qualification_history kayıtları değiştirilemez/silinemez';
END $$;
CREATE TRIGGER lead_qualification_history_no_update
  BEFORE UPDATE OR DELETE ON public.lead_qualification_history
  FOR EACH ROW EXECUTE FUNCTION public.lead_qualification_history_immutable();