ALTER TABLE public.hoppa_subscriptions
  ADD COLUMN IF NOT EXISTS card_save_token text UNIQUE DEFAULT encode(gen_random_bytes(18),'hex'),
  ADD COLUMN IF NOT EXISTS card_save_ref text,
  ADD COLUMN IF NOT EXISTS card_missing_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS card_reminder_for timestamptz;
UPDATE public.hoppa_subscriptions SET card_save_token = encode(gen_random_bytes(18),'hex') WHERE card_save_token IS NULL;