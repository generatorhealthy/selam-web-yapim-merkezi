-- 1) push_tokens tablosu
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users can manage own push tokens"
ON public.push_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access push tokens" ON public.push_tokens;
CREATE POLICY "Service role full access push tokens"
ON public.push_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.safe_timestamp_update();

-- 2) Helper: edge function URL + auth header (anon key) sabitli
-- pg_net + http_post ile send-push-notification fonksiyonunu çağıran trigger fonksiyonları

-- 2a) Yeni randevu → uzmana bildirim
CREATE OR REPLACE FUNCTION public.notify_specialist_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.specialist_id IS NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_user_id FROM public.specialists WHERE id = NEW.specialist_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(v_user_id),
      'title', 'Yeni Randevu Talebi',
      'body', NEW.patient_name || ' - ' || to_char(NEW.appointment_date, 'DD.MM.YYYY') || ' ' || NEW.appointment_time,
      'data', jsonb_build_object('type','appointment','url','/doktor-paneli','id', NEW.id::text)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_appointment ON public.appointments;
CREATE TRIGGER trg_notify_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_appointment();

-- 2b) Yeni sipariş → uzmana bildirim (e-posta eşleşmesi)
CREATE OR REPLACE FUNCTION public.notify_specialist_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.customer_email IS NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_user_id FROM public.specialists
  WHERE email = NEW.customer_email LIMIT 1;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(v_user_id),
      'title', 'Yeni Siparişiniz Var',
      'body', NEW.package_name || ' - ' || NEW.amount::text || ' TL (Ödeme bekleniyor)',
      'data', jsonb_build_object('type','order','url','/doktor-paneli','id', NEW.id::text)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_order();

-- 2c) Yeni değerlendirme yorumu → uzmana bildirim
CREATE OR REPLACE FUNCTION public.notify_specialist_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.specialist_id IS NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_user_id FROM public.specialists WHERE id = NEW.specialist_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(v_user_id),
      'title', 'Yeni Değerlendirme',
      'body', COALESCE(NEW.reviewer_name, 'Bir danışan') || ' size ' || NEW.rating::text || ' yıldız verdi',
      'data', jsonb_build_object('type','review','url','/doktor-paneli','id', NEW.id::text)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_review ON public.reviews;
CREATE TRIGGER trg_notify_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_review();

-- 2d) Yeni danışan yönlendirmesi → uzmana bildirim
-- client_referrals tablosunda is_referred=true olduğunda veya referral_count arttığında
CREATE OR REPLACE FUNCTION public.notify_specialist_new_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_should_notify boolean := false;
BEGIN
  IF NEW.specialist_id IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.referral_count,0) > 0 OR COALESCE(NEW.is_referred,false) = true THEN
      v_should_notify := true;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (COALESCE(NEW.referral_count,0) > COALESCE(OLD.referral_count,0))
       OR (COALESCE(NEW.is_referred,false) = true AND COALESCE(OLD.is_referred,false) = false) THEN
      v_should_notify := true;
    END IF;
  END IF;

  IF NOT v_should_notify THEN RETURN NEW; END IF;

  SELECT user_id INTO v_user_id FROM public.specialists WHERE id = NEW.specialist_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  PERFORM net.http_post(
    url := 'https://irnfwewabogveofwemvg.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybmZ3ZXdhYm9ndmVvZndlbXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjUzMTAsImV4cCI6MjA2NzAwMTMxMH0.yK3oE_n2a4Y7RcHbeOC2_T_OE-jXcCip2C9QLweRJqs"}'::jsonb,
    body := jsonb_build_object(
      'user_ids', jsonb_build_array(v_user_id),
      'title', 'Yeni Danışan Yönlendirmesi',
      'body', COALESCE(NEW.client_name,'') || ' ' || COALESCE(NEW.client_surname,'') || ' size yönlendirildi',
      'data', jsonb_build_object('type','referral','url','/doktor-paneli','id', NEW.id::text)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_referral_ins ON public.client_referrals;
CREATE TRIGGER trg_notify_new_referral_ins
AFTER INSERT ON public.client_referrals
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_referral();

DROP TRIGGER IF EXISTS trg_notify_new_referral_upd ON public.client_referrals;
CREATE TRIGGER trg_notify_new_referral_upd
AFTER UPDATE ON public.client_referrals
FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_new_referral();