CREATE OR REPLACE FUNCTION public.is_admin_user() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=auth.uid() AND role='admin' AND is_approved=true); $$;
CREATE OR REPLACE FUNCTION public.attach_signup_identity_to_analytics(p_session_id text,p_specialist_user_id uuid,p_specialist_email text,p_ref_code text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE verified_email text; BEGIN IF auth.uid() IS NULL OR p_specialist_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF; SELECT u.email INTO verified_email FROM auth.users u WHERE u.id=auth.uid(); IF verified_email IS NULL OR lower(trim(verified_email)) IS DISTINCT FROM lower(trim(p_specialist_email)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF; UPDATE public.registration_analytics SET specialist_user_id=auth.uid(),specialist_email=lower(verified_email),ref_code=coalesce(p_ref_code,ref_code),last_activity_at=now() WHERE session_id=p_session_id AND (specialist_user_id IS NULL OR specialist_user_id=auth.uid()); END; $$;
REVOKE EXECUTE ON FUNCTION public.attach_signup_identity_to_analytics(text,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.attach_signup_identity_to_analytics(text,uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.register_partner_referral(p_referral_code text, p_specialist_user_id uuid, p_specialist_email text, p_specialist_name text, p_specialist_phone text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_partner_id uuid; v_commission numeric; v_id uuid; v_norm text; verified_email text; verified_name text; verified_phone text;
BEGIN
 IF auth.uid() IS NULL OR p_specialist_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT u.email INTO verified_email FROM auth.users u WHERE u.id=auth.uid();
 IF verified_email IS NULL OR lower(trim(verified_email)) IS DISTINCT FROM lower(trim(p_specialist_email)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT s.name,s.phone INTO verified_name,verified_phone FROM public.specialists s WHERE s.user_id=auth.uid() AND lower(trim(s.email))=lower(trim(verified_email)) ORDER BY s.created_at DESC LIMIT 1;
 IF verified_name IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 v_norm := public.normalize_ref_code(p_referral_code);
 IF v_norm IS NULL OR length(v_norm)<3 THEN RETURN NULL; END IF;
 SELECT id,commission_per_signup INTO v_partner_id,v_commission FROM public.partners WHERE is_active=true AND (public.normalize_ref_code(referral_code)=v_norm OR public.normalize_ref_code(name)=v_norm) LIMIT 1;
 IF v_partner_id IS NULL THEN SELECT id,commission_per_signup INTO v_partner_id,v_commission FROM public.partners WHERE is_active=true AND (public.normalize_ref_code(referral_code) LIKE v_norm||'%' OR v_norm LIKE public.normalize_ref_code(referral_code)||'%' OR public.normalize_ref_code(name) LIKE v_norm||'%' OR v_norm LIKE public.normalize_ref_code(name)||'%') ORDER BY length(public.normalize_ref_code(referral_code)) DESC LIMIT 1; END IF;
 IF v_partner_id IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.partner_referrals(partner_id,specialist_user_id,specialist_email,specialist_name,specialist_phone,commission_amount,commission_status) VALUES(v_partner_id,auth.uid(),lower(verified_email),verified_name,verified_phone,COALESCE(v_commission,1000),'pending') ON CONFLICT(partner_id,specialist_email) DO UPDATE SET specialist_user_id=COALESCE(EXCLUDED.specialist_user_id,public.partner_referrals.specialist_user_id),specialist_name=COALESCE(EXCLUDED.specialist_name,public.partner_referrals.specialist_name),specialist_phone=COALESCE(EXCLUDED.specialist_phone,public.partner_referrals.specialist_phone),updated_at=now() RETURNING id INTO v_id;
 RETURN v_id;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.register_partner_referral(text,uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_partner_referral(text,uuid,text,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.register_partner_referral(p_referral_code text, p_specialist_user_id uuid, p_specialist_email text, p_specialist_name text, p_specialist_phone text, p_session_id text DEFAULT NULL::text, p_landing_url text DEFAULT NULL::text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_partner_id uuid; v_commission numeric; v_id uuid; v_norm text; verified_email text; verified_name text; verified_phone text;
BEGIN
 IF auth.uid() IS NULL OR p_specialist_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT u.email INTO verified_email FROM auth.users u WHERE u.id=auth.uid();
 IF verified_email IS NULL OR lower(trim(verified_email)) IS DISTINCT FROM lower(trim(p_specialist_email)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT s.name,s.phone INTO verified_name,verified_phone FROM public.specialists s WHERE s.user_id=auth.uid() AND lower(trim(s.email))=lower(trim(verified_email)) ORDER BY s.created_at DESC LIMIT 1;
 IF verified_name IS NULL THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 v_norm := public.normalize_ref_code(p_referral_code);
 IF v_norm IS NULL OR length(v_norm)<3 THEN RETURN NULL; END IF;
 SELECT id,commission_per_signup INTO v_partner_id,v_commission FROM public.partners WHERE is_active=true AND (public.normalize_ref_code(referral_code)=v_norm OR public.normalize_ref_code(name)=v_norm) LIMIT 1;
 IF v_partner_id IS NULL THEN SELECT id,commission_per_signup INTO v_partner_id,v_commission FROM public.partners WHERE is_active=true AND (public.normalize_ref_code(referral_code) LIKE v_norm||'%' OR v_norm LIKE public.normalize_ref_code(referral_code)||'%' OR public.normalize_ref_code(name) LIKE v_norm||'%' OR v_norm LIKE public.normalize_ref_code(name)||'%') ORDER BY length(public.normalize_ref_code(referral_code)) DESC LIMIT 1; END IF;
 IF v_partner_id IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.partner_referrals(partner_id,specialist_user_id,specialist_email,specialist_name,specialist_phone,commission_amount,commission_status,ref_code_used,landing_url,signup_session_id,source) VALUES(v_partner_id,auth.uid(),lower(verified_email),verified_name,verified_phone,COALESCE(v_commission,1000),'pending',p_referral_code,p_landing_url,p_session_id,'link') ON CONFLICT(partner_id,specialist_email) DO UPDATE SET specialist_user_id=COALESCE(EXCLUDED.specialist_user_id,public.partner_referrals.specialist_user_id),specialist_name=COALESCE(EXCLUDED.specialist_name,public.partner_referrals.specialist_name),specialist_phone=COALESCE(EXCLUDED.specialist_phone,public.partner_referrals.specialist_phone),ref_code_used=COALESCE(EXCLUDED.ref_code_used,public.partner_referrals.ref_code_used),landing_url=COALESCE(EXCLUDED.landing_url,public.partner_referrals.landing_url),signup_session_id=COALESCE(EXCLUDED.signup_session_id,public.partner_referrals.signup_session_id),source='link',updated_at=now() RETURNING id INTO v_id;
 RETURN v_id;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.register_partner_referral(text,uuid,text,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_partner_referral(text,uuid,text,text,text,text,text) TO authenticated;
DROP POLICY "Public may create referral for active partner" ON public.partner_referrals;