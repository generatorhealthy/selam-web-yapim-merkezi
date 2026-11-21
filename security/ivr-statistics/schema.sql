-- Candidate only. No production execution until separate release approval.
CREATE TABLE public.lead_ivr_campaign_metadata (
  campaign_id uuid PRIMARY KEY REFERENCES public.lead_ivr_campaigns(id),
  source_status text NOT NULL CHECK(source_status IN ('no_answer','wrong'))
);
GRANT ALL ON public.lead_ivr_campaign_metadata TO service_role;
ALTER TABLE public.lead_ivr_campaign_metadata ENABLE ROW LEVEL SECURITY;
-- Populated only for newly approved campaigns; historical sources stay unknown.
CREATE TABLE public.lead_ivr_call_events (
  call_id uuid NOT NULL REFERENCES public.lead_ivr_calls(id),
  event_key text NOT NULL,
  kind text NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  line text NOT NULL,
  reason text,
  PRIMARY KEY (call_id, event_key),
  CONSTRAINT ivr_event_kind CHECK (kind IN ('ringing','answered','digit_1','digit_2','ended','heartbeat')),
  CONSTRAINT ivr_event_line CHECK (line IN ('80','81')),
  CONSTRAINT ivr_event_reason CHECK (reason IS NULL OR reason IN ('no_answer','busy','failed','cancelled','normal','unknown'))
);
GRANT ALL ON public.lead_ivr_call_events TO service_role;
ALTER TABLE public.lead_ivr_call_events ENABLE ROW LEVEL SECURITY;
-- No browser grants: verified admin endpoint returns minimal fields.
CREATE INDEX ivr_events_time_idx ON public.lead_ivr_call_events(occurred_at);

CREATE OR REPLACE FUNCTION public.record_ivr_telemetry(
  p_call_id uuid, p_event_key text, p_kind text, p_occurred_at timestamptz, p_line text, p_reason text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE accepted integer;
BEGIN
  IF session_user NOT IN ('postgres','service_role') AND COALESCE(current_setting('role',true),'') <> 'service_role' THEN
    RAISE EXCEPTION 'service only' USING ERRCODE = '42501';
  END IF;
  IF length(p_event_key) NOT BETWEEN 1 AND 100 OR p_event_key !~ '^[a-zA-Z0-9_.:-]+$'
    OR p_occurred_at > now() + interval '30 seconds' OR p_occurred_at < now() - interval '1 day'
    OR NOT EXISTS (SELECT 1 FROM public.lead_ivr_calls WHERE id=p_call_id AND dispatched_at IS NOT NULL
      AND p_occurred_at >= dispatched_at - interval '5 seconds') THEN
    RAISE EXCEPTION 'invalid event';
  END IF;
  INSERT INTO public.lead_ivr_call_events(call_id,event_key,kind,occurred_at,line,reason)
    VALUES(p_call_id,p_event_key,p_kind,p_occurred_at,p_line,p_reason) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS accepted = ROW_COUNT;
  RETURN accepted=1;
END $$;
REVOKE ALL ON FUNCTION public.record_ivr_telemetry(uuid,text,text,timestamptz,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_ivr_telemetry(uuid,text,text,timestamptz,text,text) TO service_role;

CREATE VIEW public.lead_ivr_telemetry WITH (security_invoker=true) AS
SELECT call_id, min(line) AS line,
  min(occurred_at) FILTER (WHERE kind='ringing') AS ringing_at,
  min(occurred_at) FILTER (WHERE kind='answered') AS answered_at,
  min(occurred_at) FILTER (WHERE kind IN ('digit_1','digit_2')) AS digit_at,
  max(occurred_at) FILTER (WHERE kind='ended') AS ended_at,
  max(occurred_at) AS observed_at,
  (array_agg(reason ORDER BY occurred_at DESC, event_key) FILTER (WHERE kind='ended'))[1] AS end_reason
FROM public.lead_ivr_call_events GROUP BY call_id;
REVOKE ALL ON public.lead_ivr_telemetry FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lead_ivr_telemetry TO service_role;