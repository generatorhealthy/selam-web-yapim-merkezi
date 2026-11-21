ALTER TABLE public.lead_ivr_calls ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE public.lead_ivr_calls ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'queued';
ALTER TABLE public.lead_ivr_calls ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE public.lead_ivr_calls ADD COLUMN IF NOT EXISTS pbx_call_id text;
CREATE INDEX IF NOT EXISTS lead_ivr_calls_state_idx ON public.lead_ivr_calls(campaign_id, state);