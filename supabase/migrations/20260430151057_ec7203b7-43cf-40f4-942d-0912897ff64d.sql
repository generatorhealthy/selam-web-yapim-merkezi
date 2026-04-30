
CREATE OR REPLACE FUNCTION public.admin_update_specialist_slug(p_specialist_id uuid, p_new_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_clean_slug text;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz: oturum yok');
  END IF;

  SELECT role INTO v_role FROM public.user_profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_role IS NULL OR v_role <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yalnızca admin kullanıcılar profil linkini değiştirebilir');
  END IF;

  -- Temizle: küçük harf, türkçe karakterler dönüştür, sadece a-z 0-9 ve tire
  v_clean_slug := lower(trim(p_new_slug));
  v_clean_slug := translate(v_clean_slug, 'ışğüöçâîû', 'isguocaiu');
  v_clean_slug := regexp_replace(v_clean_slug, '[^a-z0-9\s-]', '', 'g');
  v_clean_slug := regexp_replace(v_clean_slug, '\s+', '-', 'g');
  v_clean_slug := regexp_replace(v_clean_slug, '-+', '-', 'g');
  v_clean_slug := trim(both '-' from v_clean_slug);

  IF v_clean_slug = '' OR length(v_clean_slug) < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Geçersiz slug (en az 3 karakter olmalı)');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.specialists
    WHERE slug = v_clean_slug AND id <> p_specialist_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bu link başka bir uzman tarafından kullanılıyor');
  END IF;

  -- preserve_specialist_slug trigger'ını bypass etmek için triggeri geçici devre dışı bırak
  ALTER TABLE public.specialists DISABLE TRIGGER trg_preserve_specialist_slug;
  UPDATE public.specialists SET slug = v_clean_slug WHERE id = p_specialist_id;
  ALTER TABLE public.specialists ENABLE TRIGGER trg_preserve_specialist_slug;

  RETURN jsonb_build_object('success', true, 'slug', v_clean_slug);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_specialist_slug(uuid, text) TO authenticated;
