ALTER TABLE public.meta_daily_metrics
  ADD COLUMN IF NOT EXISTS account_id text,
  ADD COLUMN IF NOT EXISTS date_stop date,
  ADD COLUMN IF NOT EXISTS cost_per_link_click numeric,
  ADD COLUMN IF NOT EXISTS raw_actions jsonb,
  ADD COLUMN IF NOT EXISTS raw_action_values jsonb;