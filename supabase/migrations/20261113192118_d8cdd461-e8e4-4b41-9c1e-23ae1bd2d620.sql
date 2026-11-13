CREATE OR REPLACE FUNCTION public.verify_internal_cron_token(p_token text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
  SELECT p_token IS NOT NULL AND length(p_token) = 64 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets s
    WHERE s.name = 'internal_cron_token' AND s.decrypted_secret = p_token);
$$;
REVOKE ALL ON FUNCTION public.verify_internal_cron_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_internal_cron_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.update_registration_analytics(p_session_id text, p_current_step integer, p_step_timestamps jsonb, p_click_events jsonb, p_time_on_page integer, p_completed boolean, p_left boolean DEFAULT false)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  UPDATE public.registration_analytics SET
    current_step = COALESCE(p_current_step, current_step),
    max_step_reached = GREATEST(COALESCE(max_step_reached,1), COALESCE(p_current_step,1)),
    step_timestamps = COALESCE(step_timestamps,'{}'::jsonb) || COALESCE(p_step_timestamps,'{}'::jsonb),
    click_events = COALESCE(p_click_events, click_events),
    time_on_page = GREATEST(COALESCE(time_on_page,0), COALESCE(p_time_on_page,0)),
    last_activity_at = now(),
    left_at = CASE WHEN p_left THEN now() ELSE left_at END,
    completed = completed OR COALESCE(p_completed,false)
  WHERE session_id = p_session_id
    AND created_at > now() - interval '2 days'
    AND (p_current_step IS NULL OR p_current_step BETWEEN 1 AND 10)
    AND octet_length(COALESCE(p_click_events,'[]'::jsonb)::text) <= 20000
    AND octet_length(COALESCE(p_step_timestamps,'{}'::jsonb)::text) <= 4000
    AND (
      -- New sessions: unguessable 122-bit random identifier is the only capability.
      p_session_id ~ '^reg_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      -- Legacy tab sessions already open before this change expire within two days.
      OR created_at < timestamptz '2026-11-13 18:45:00+00'
    );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_user_approved(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_approved(uuid) TO service_role;