ALTER FUNCTION public.set_manual_order_approval(uuid,text,text) RENAME TO set_manual_order_approval_internal;
REVOKE ALL ON FUNCTION public.set_manual_order_approval_internal(uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.set_manual_order_approval_server(p_order_id uuid,p_action text,p_reason text,p_actor_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; prior text;
BEGIN
 IF NOT coalesce(auth.role()='service_role',false) THEN RAISE EXCEPTION 'manual_service_required' USING ERRCODE='42501'; END IF;
 IF p_actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=p_actor_id AND role='admin' AND is_approved=true) THEN RAISE EXCEPTION 'manual_admin_required' USING ERRCODE='42501'; END IF;
 prior := current_setting('request.jwt.claim.sub',true);
 PERFORM set_config('request.jwt.claim.sub',p_actor_id::text,true);
 result := public.set_manual_order_approval_internal(p_order_id,p_action,p_reason);
 PERFORM set_config('request.jwt.claim.sub',coalesce(prior,''),true);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.set_manual_order_approval_server(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_manual_order_approval_server(uuid,text,text,uuid) TO service_role;