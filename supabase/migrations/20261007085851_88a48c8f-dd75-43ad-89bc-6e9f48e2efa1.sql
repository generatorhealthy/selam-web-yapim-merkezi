ALTER TABLE public.meta_capi_events
  ADD COLUMN IF NOT EXISTS meta_status text,
  ADD COLUMN IF NOT EXISTS http_status integer,
  ADD COLUMN IF NOT EXISTS events_received integer,
  ADD COLUMN IF NOT EXISTS meta_messages jsonb,
  ADD COLUMN IF NOT EXISTS fbtrace_id text,
  ADD COLUMN IF NOT EXISTS event_time timestamptz,
  ADD COLUMN IF NOT EXISTS dataset_id text,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;
ALTER TABLE public.meta_capi_events ADD CONSTRAINT meta_capi_events_meta_status_check
  CHECK (meta_status IS NULL OR meta_status IN ('META_ACCEPTED','META_RESPONSE_UNVERIFIED','META_REJECTED','TEST_NOT_SENT'));
UPDATE public.meta_capi_events SET meta_status = 'META_RESPONSE_UNVERIFIED', dataset_id = '1053321257408384',
  event_time = (payload->>'event_time')::timestamptz, last_attempt_at = sent_at
  WHERE status = 'sent' AND coalesce(is_test,false) = false AND meta_status IS NULL;
UPDATE public.meta_capi_events SET meta_status = 'TEST_NOT_SENT' WHERE is_test = true AND meta_status IS NULL;