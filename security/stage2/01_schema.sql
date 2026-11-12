-- Aşama 2 / A — YALNIZCA EKLEMELER
-- Bu dosya mevcut hiçbir politikayı, tabloyu, veriyi veya akışı DEĞİŞTİRMEZ.
-- Yeni olan: yasal metin kopyaları, tek kullanımlık onay fişleri ve bunları yöneten sunucu fonksiyonları.
-- Sıra: 01 -> (fonksiyon + istemci yayını) -> 02 -> 03. 01 tek başına güvenlidir.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Yasal metinlerin değiştirilemez, tarihli kopyaları
--    Onay kayıtları bu metinlerin özetine bağlanır; "hangi metin onaylandı"
--    sorusu 5 yıl sonra da yanıtlanabilir.
-- ---------------------------------------------------------------------------
CREATE TABLE public.legal_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_key text NOT NULL,
  doc_version text NOT NULL,
  body_text text NOT NULL,
  body_sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT legal_documents_unique_key_version UNIQUE (doc_key, doc_version),
  CONSTRAINT legal_documents_sha256_format CHECK (body_sha256 ~ '^[0-9a-f]{64}$'::text),
  CONSTRAINT legal_documents_key_not_empty CHECK (length(trim(doc_key)) > 0),
  CONSTRAINT legal_documents_version_not_empty CHECK (length(trim(doc_version)) > 0)
);

GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_documents_select" ON public.legal_documents
  FOR SELECT TO anon, authenticated USING (true);

-- Değiştirilemezlik: metin bir kez yazıldıktan sonra güncellenemez ve silinemez.
CREATE OR REPLACE FUNCTION public.block_legal_documents_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'legal_documents kayıtları değiştirilemez veya silinemez';
END $$;

CREATE TRIGGER legal_documents_immutable
  BEFORE UPDATE OR DELETE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.block_legal_documents_mutation();

-- ---------------------------------------------------------------------------
-- 2) Tek kullanımlık, kişiye bağlı onay fişleri
--    Sunucuda YALNIZCA özet saklanır: ham fiş ve e-posta tabloya yazılmaz.
--    Politika bilinçli olarak yok -> tarayıcı (anon/authenticated) erişemez.
-- ---------------------------------------------------------------------------
CREATE TABLE public.consent_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL,
  email_hash text NOT NULL,
  ip_hash text,
  account_id uuid,
  allowed_types text[] NOT NULL DEFAULT '{}'::text[],
  doc_key text NOT NULL,
  doc_version text NOT NULL,
  doc_sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  consume_ip_hash text,
  consume_account_id uuid,
  CONSTRAINT consent_grants_token_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$'::text),
  CONSTRAINT consent_grants_email_hash_format CHECK (email_hash ~ '^[0-9a-f]{64}$'::text),
  CONSTRAINT consent_grants_doc_sha256_format CHECK (doc_sha256 ~ '^[0-9a-f]{64}$'::text),
  CONSTRAINT consent_grants_types_allowed
    CHECK (allowed_types <@ ARRAY['disclosure', 'explicit_consent', 'marketing_etk']::text[]),
  CONSTRAINT consent_grants_expiry CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX consent_grants_token_hash_key ON public.consent_grants (token_hash);
CREATE INDEX consent_grants_ip_window ON public.consent_grants (ip_hash, created_at);
CREATE INDEX consent_grants_email_window ON public.consent_grants (email_hash, created_at);
CREATE INDEX consent_grants_account_window ON public.consent_grants (account_id, created_at);

GRANT ALL ON public.consent_grants TO service_role;
ALTER TABLE public.consent_grants ENABLE ROW LEVEL SECURITY;

-- Çekirdek alanlar sonradan değiştirilemez; kullanılmış fiş geri alınamaz.
CREATE OR REPLACE FUNCTION public.protect_consent_grant_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.token_hash IS DISTINCT FROM OLD.token_hash
     OR NEW.email_hash IS DISTINCT FROM OLD.email_hash
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.doc_sha256 IS DISTINCT FROM OLD.doc_sha256
     OR NEW.doc_key IS DISTINCT FROM OLD.doc_key
     OR NEW.doc_version IS DISTINCT FROM OLD.doc_version
     OR NEW.allowed_types IS DISTINCT FROM OLD.allowed_types THEN
    RAISE EXCEPTION 'consent_grants çekirdek alanları değiştirilemez';
  END IF;
  IF OLD.used_at IS NOT NULL AND NEW.used_at IS DISTINCT FROM OLD.used_at THEN
    RAISE EXCEPTION 'kullanılmış fiş geri alınamaz';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER consent_grants_protect
  BEFORE UPDATE ON public.consent_grants
  FOR EACH ROW EXECUTE FUNCTION public.protect_consent_grant_fields();

-- ---------------------------------------------------------------------------
-- 3) Yardımcılar: e-posta / IP normalize ve özet
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consent_email_key(p_email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(trim(coalesce(p_email, '')))
$$;

-- IP özetinde /24 (IPv4) veya /64 (IPv6) öneki korunur: aynı hane/ortak çıkış
-- tek bir kişi gibi cezalanmasın, ama tek IP ile sınırsız üretim de yapılmasın.
CREATE OR REPLACE FUNCTION public.consent_ip_key(p_ip text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  t text := trim(coalesce(p_ip, ''));
BEGIN
  IF t = '' THEN
    RETURN NULL;
  END IF;
  IF t ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'::text THEN
    RETURN (regexp_match(t, '^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\.'::text))[1] || '.0';
  END IF;
  IF position(':' in t) > 0 THEN
    RETURN split_part(t, ':', 1) || ':' || split_part(t, ':', 2) || ':'
        || split_part(t, ':', 3) || ':' || split_part(t, ':', 4) || '::/64';
  END IF;
  RETURN t;
END $$;

CREATE OR REPLACE FUNCTION public.consent_sha256(p_input text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT encode(digest(p_input, 'sha256'), 'hex')
$$;

-- Politikalardan çağrılan "gerçekten yayında mı?" kontrolleri.
-- (specialists/tests tarayıcıya açık seçilemediği için SECURITY DEFINER gerekir;
--  yalnızca boolean döner, hiçbir veri alanı sızdırmaz.)
CREATE OR REPLACE FUNCTION public.is_public_specialist(p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.specialists s WHERE s.id = p_id AND s.is_active = true)
$$;

CREATE OR REPLACE FUNCTION public.is_public_test(p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tests t WHERE t.id = p_id AND coalesce(t.is_active, true) = true)
$$;

-- ---------------------------------------------------------------------------
-- 4) Fiş ÜRETİMİ — sunucuda, hız sınırlı
--    Eşikleri: IP /24 başına saatte 20, e-posta başına 3, hesap başına 3.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_consent_grant(
  p_email text,
  p_ip text,
  p_account_id uuid,
  p_allowed_types text[],
  p_doc_key text,
  p_doc_version text
)
RETURNS TABLE(token text, valid_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email_key text := public.consent_email_key(p_email);
  v_email_hash text;
  v_ip_hash text := public.consent_sha256(public.consent_ip_key(p_ip));
  v_doc public.legal_documents%ROWTYPE;
  v_ip_count integer;
  v_email_count integer;
  v_account_count integer;
  v_token text;
  v_expiry timestamptz := now() + interval '10 minutes';
BEGIN
  IF v_email_key = '' OR v_email_key !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'::text THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF p_allowed_types IS NULL OR cardinality(p_allowed_types) = 0 THEN
    RAISE EXCEPTION 'no_consent_types';
  END IF;
  IF NOT (p_allowed_types <@ ARRAY['disclosure', 'explicit_consent', 'marketing_etk']::text[]) THEN
    RAISE EXCEPTION 'invalid_consent_type';
  END IF;
  IF NOT ('disclosure' = ANY (p_allowed_types)) THEN
    RAISE EXCEPTION 'disclosure_required';
  END IF;

  SELECT * INTO v_doc FROM public.legal_documents
   WHERE doc_key = p_doc_key AND doc_version = p_doc_version;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown_document';
  END IF;

  v_email_hash := public.consent_sha256(v_email_key);

  IF v_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_ip_count FROM public.consent_grants
     WHERE ip_hash = v_ip_hash AND created_at > now() - interval '1 hour';
    IF v_ip_count >= 20 THEN
      RAISE EXCEPTION 'ip_limit';
    END IF;
  END IF;

  SELECT count(*) INTO v_email_count FROM public.consent_grants
   WHERE email_hash = v_email_hash AND created_at > now() - interval '1 hour';
  IF v_email_count >= 3 THEN
    RAISE EXCEPTION 'email_limit';
  END IF;

  IF p_account_id IS NOT NULL THEN
    SELECT count(*) INTO v_account_count FROM public.consent_grants
     WHERE account_id = p_account_id AND created_at > now() - interval '1 hour';
    IF v_account_count >= 3 THEN
      RAISE EXCEPTION 'account_limit';
    END IF;
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.consent_grants
    (token_hash, email_hash, ip_hash, account_id, allowed_types,
     doc_key, doc_version, doc_sha256, expires_at)
  VALUES
    (public.consent_sha256(v_token), v_email_hash, v_ip_hash, p_account_id, p_allowed_types,
     v_doc.doc_key, v_doc.doc_version, v_doc.body_sha256, v_expiry);

  token := v_token;
  valid_until := v_expiry;
  RETURN NEXT;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Fiş TÜKETİMİ — atomik tek kullanım + kişi bağlama + hız sınırı
--    UPDATE ... WHERE used_at IS NULL aynı anda iki istek gelse bile fişi
--    yalnızca bir kez kullanılır kılar.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_consent_grant(
  p_token text,
  p_email text,
  p_ip text,
  p_account_id uuid
)
RETURNS TABLE(allowed_types text[], doc_key text, doc_version text, doc_sha256 text, email_key text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token_hash text;
  v_email_key text := public.consent_email_key(p_email);
  v_email_hash text;
  v_ip_hash text := public.consent_sha256(public.consent_ip_key(p_ip));
  v_row public.consent_grants%ROWTYPE;
  v_attempts integer;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$'::text THEN
    RAISE EXCEPTION 'malformed_token';
  END IF;
  IF v_email_key = '' OR v_email_key !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'::text THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  -- Tüketim denemeleri de sınırlı: aynı /24 saatte en fazla 60 tüketim.
  IF v_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_attempts FROM public.consent_grants
     WHERE consume_ip_hash = v_ip_hash AND used_at > now() - interval '1 hour';
    IF v_attempts >= 60 THEN
      RAISE EXCEPTION 'consume_ip_limit';
    END IF;
  END IF;

  v_token_hash := public.consent_sha256(p_token);
  v_email_hash := public.consent_sha256(v_email_key);

  UPDATE public.consent_grants
     SET used_at = now(),
         consume_ip_hash = v_ip_hash,
         consume_account_id = p_account_id
   WHERE token_hash = v_token_hash
     AND used_at IS NULL
     AND expires_at > now()
     AND email_hash = v_email_hash
   RETURNING * INTO v_row;

  IF NOT FOUND THEN
    -- Neden reddedildiğini ayırt et (fiş özetinden geri türetme yok).
    SELECT * INTO v_row FROM public.consent_grants WHERE token_hash = v_token_hash;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'grant_not_found';
    END IF;
    IF v_row.used_at IS NOT NULL THEN
      RAISE EXCEPTION 'grant_already_used';
    END IF;
    IF v_row.expires_at <= now() THEN
      RAISE EXCEPTION 'grant_expired';
    END IF;
    RAISE EXCEPTION 'grant_email_mismatch';
  END IF;

  allowed_types := v_row.allowed_types;
  doc_key := v_row.doc_key;
  doc_version := v_row.doc_version;
  doc_sha256 := v_row.doc_sha256;
  email_key := v_email_key;
  RETURN NEXT;
END $$;

-- Fiş fonksiyonları yalnızca sunucu anahtarıyla çağrılabilir.
REVOKE ALL ON FUNCTION public.issue_consent_grant(text, text, uuid, text[], text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_consent_grant(text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_consent_grant(text, text, uuid, text[], text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_consent_grant(text, text, uuid) TO service_role;
