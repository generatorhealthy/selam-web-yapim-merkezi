CREATE OR REPLACE FUNCTION public.update_registration_analytics(
  p_session_id text, p_current_step int, p_step_timestamps jsonb, p_click_events jsonb,
  p_time_on_page int, p_completed boolean, p_left boolean DEFAULT false)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.registration_analytics SET
    current_step = COALESCE(p_current_step, current_step),
    max_step_reached = GREATEST(COALESCE(max_step_reached,1), COALESCE(p_current_step,1)),
    step_timestamps = COALESCE(step_timestamps,'{}'::jsonb) || COALESCE(p_step_timestamps,'{}'::jsonb),
    click_events = COALESCE(p_click_events, click_events),
    time_on_page = GREATEST(COALESCE(time_on_page,0), COALESCE(p_time_on_page,0)),
    last_activity_at = now(),
    left_at = CASE WHEN p_left THEN now() ELSE left_at END,
    completed = completed OR COALESCE(p_completed,false)
  WHERE session_id = p_session_id AND created_at > now() - interval '2 days';
$$;
REVOKE ALL ON FUNCTION public.update_registration_analytics(text,int,jsonb,jsonb,int,boolean,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_registration_analytics(text,int,jsonb,jsonb,int,boolean,boolean) TO anon, authenticated;