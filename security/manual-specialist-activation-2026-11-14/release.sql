CREATE TABLE public.specialist_publication_permissions (
 specialist_id uuid PRIMARY KEY REFERENCES public.specialists(id),
 actor_id uuid NOT NULL,
 active boolean NOT NULL,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.specialist_publication_permissions TO authenticated;
GRANT ALL ON public.specialist_publication_permissions TO service_role;
ALTER TABLE public.specialist_publication_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY publication_admin_read ON public.specialist_publication_permissions FOR SELECT TO authenticated USING(public.is_admin_user());
CREATE TABLE public.specialist_publication_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),specialist_id uuid NOT NULL REFERENCES public.specialists(id),
 actor_id uuid NOT NULL,active boolean NOT NULL,reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.specialist_publication_events TO authenticated;
GRANT SELECT,INSERT ON public.specialist_publication_events TO service_role;
ALTER TABLE public.specialist_publication_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY publication_events_admin_read ON public.specialist_publication_events FOR SELECT TO authenticated USING(public.is_admin_user());
CREATE OR REPLACE FUNCTION public.set_specialist_publication_server(p_specialist_id uuid,p_active boolean,p_reason text,p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.specialists;
BEGIN
 IF NOT coalesce(auth.role()='service_role',false) THEN RAISE EXCEPTION 'publication_service_required' USING ERRCODE='42501'; END IF;
 IF p_actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=p_actor_id AND role='admin' AND is_approved=true) THEN RAISE EXCEPTION 'publication_admin_required' USING ERRCODE='42501'; END IF;
 IF p_active IS NULL OR p_reason IS NULL OR length(trim(p_reason))<5 OR length(p_reason)>1000 THEN RAISE EXCEPTION 'publication_reason_required' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM public.specialists WHERE id=p_specialist_id FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'publication_specialist_missing' USING ERRCODE='23514'; END IF;
 IF p_active AND (s.user_id IS NULL OR s.email IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=s.user_id AND lower(trim(email))=lower(trim(s.email)))) THEN RAISE EXCEPTION 'publication_identity_required' USING ERRCODE='23514'; END IF;
 IF s.is_active IS NOT DISTINCT FROM p_active THEN RETURN jsonb_build_object('success',true,'duplicate',true,'active',s.is_active); END IF;
 INSERT INTO public.specialist_publication_permissions(specialist_id,actor_id,active,reason) VALUES(s.id,p_actor_id,p_active,trim(p_reason))
 ON CONFLICT(specialist_id) DO UPDATE SET actor_id=p_actor_id,active=p_active,reason=trim(p_reason),updated_at=now();
 UPDATE public.specialists SET is_active=p_active WHERE id=s.id;
 INSERT INTO public.specialist_publication_events(specialist_id,actor_id,active,reason) VALUES(s.id,p_actor_id,p_active,trim(p_reason));
 RETURN jsonb_build_object('success',true,'duplicate',false,'active',p_active);
END $$;
REVOKE ALL ON FUNCTION public.set_specialist_publication_server(uuid,boolean,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_specialist_publication_server(uuid,boolean,text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.require_activation_evidence() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF coalesce(NEW.is_active,false) AND (TG_OP='INSERT' OR NOT coalesce(OLD.is_active,false)) THEN
  IF NEW.user_id IS NULL OR NEW.email IS NULL OR NOT (
   EXISTS(SELECT 1 FROM public.orders o WHERE lower(trim(o.customer_email))=lower(trim(NEW.email)) AND o.status IN ('approved','completed') AND o.deleted_at IS NULL AND (o.payment_method NOT IN ('bank_transfer','banka_havalesi') OR EXISTS(SELECT 1 FROM public.bank_transfer_verifications v WHERE v.order_id=o.id AND v.specialist_id=NEW.id AND v.amount=o.amount AND v.statement_checked) OR EXISTS(SELECT 1 FROM public.bank_legacy_paid_orders l WHERE l.order_id=o.id)))
   OR EXISTS(SELECT 1 FROM public.order_manual_approvals a JOIN public.orders o ON o.id=a.order_id WHERE a.specialist_id=NEW.id AND a.active AND o.deleted_at IS NULL AND o.status='pending' AND lower(trim(o.customer_email))=lower(trim(NEW.email)) AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))))
   OR EXISTS(SELECT 1 FROM public.specialist_publication_permissions p WHERE p.specialist_id=NEW.id AND p.active AND EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND lower(trim(u.email))=lower(trim(NEW.email))))
  ) THEN RAISE EXCEPTION 'paid_order_activation_required' USING ERRCODE='42501'; END IF;
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.require_activation_evidence() FROM PUBLIC,anon,authenticated;