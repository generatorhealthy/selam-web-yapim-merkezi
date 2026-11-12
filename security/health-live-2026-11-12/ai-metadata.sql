-- Preserve every record; existing authenticated admin/staff RLS remains in force.
REVOKE SELECT ON public.ai_call_sessions FROM PUBLIC,anon,authenticated;
REVOKE SELECT (transcript,error_message) ON public.ai_call_sessions FROM PUBLIC,anon,authenticated;
GRANT SELECT (id,lead_id,lead_name,lead_phone,line_prefix,channel_id,status,outcome,transferred_specialist_id,transferred_specialist_name,transferred_extension,callback_at,is_test,started_at,ended_at,created_at) ON public.ai_call_sessions TO authenticated;