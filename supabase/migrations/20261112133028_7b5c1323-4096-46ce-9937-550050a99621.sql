-- ============================================================
-- Aşama 1 – Kritik RPC güvenliği
-- Yalnızca EXECUTE yetkisi daraltılır. Hiçbir tablo, satır, sütun
-- veya kullanıcı verisi silinmez/değiştirilmez.
-- Geri alma: aşağıdaki her REVOKE satırının karşılığı GRANT ile açılır;
-- eklenen yönetici kontrolleri fonksiyonların eski tanımıyla değiştirilerek geri alınır.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Çağrısı olmayan kritik fonksiyonlar (uygulama, edge function,
--    RLS politikası, tetikleyici ve cron incelemesinde hiç çağıran bulunmadı)
--    -> anonim ve oturum açmış rollerin yetkisi kaldırılır, yalnızca sunucu.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.restore_client_referrals_from_backup FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.merge_duplicate_client_referrals     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_specialist_profile            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.list_client_referrals_backups        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_patient_user                      FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------
-- 2) Yedek tutma / temizlik fonksiyonları
--    Zamanlanmış görevler postgres rolüyle çalışıyor (job 23, job 24),
--    istemci rollerine gerek yok -> yalnızca sunucu.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.cleanup_old_backups     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backup_client_referrals FROM PUBLIC, anon, authenticated;

-- Sunucu tarafı kullanımın açık ve kalıcı olması için yetkiyi ayrıca veriyoruz.
GRANT  EXECUTE ON FUNCTION public.restore_client_referrals_from_backup TO service_role;
GRANT  EXECUTE ON FUNCTION public.merge_duplicate_client_referrals     TO service_role;
GRANT  EXECUTE ON FUNCTION public.create_specialist_profile            TO service_role;
GRANT  EXECUTE ON FUNCTION public.cleanup_expired_otps                 TO service_role;
GRANT  EXECUTE ON FUNCTION public.list_client_referrals_backups        TO service_role;
GRANT  EXECUTE ON FUNCTION public.is_patient_user                      TO service_role;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_backups                  TO service_role;
GRANT  EXECUTE ON FUNCTION public.backup_client_referrals              TO service_role;

-- ------------------------------------------------------------
-- 3) Yönetici panelinden çağrılan fonksiyonlar
--    Anonim ziyaretçi yetkisi kaldırılır; oturum açmış kullanıcı için
--    işlemin İÇİNE güvenilir rol kontrolü konur (aşağıdaki tanımlar).
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.list_database_backups FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_from_backup   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_order_stats       FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_database_backups TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.restore_from_backup   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_order_stats       TO authenticated, service_role;

-- ------------------------------------------------------------
-- 3a) Yedekleri listeleme: artık yalnızca yönetici
--     (database_backups tablosunun kendi erişim kuralı da yönetici istiyor)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_database_backups()
 RETURNS TABLE(id bigint, backup_timestamp timestamp with time zone, backup_type text, backup_status text, tables_count integer, total_records integer, created_by uuid, notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.backup_timestamp,
    b.backup_type,
    b.backup_status,
    array_length(b.tables_backed_up, 1) as tables_count,
    b.total_records,
    b.created_by,
    b.notes
  FROM public.database_backups b
  ORDER BY b.backup_timestamp DESC;
END;
$function$;

-- ------------------------------------------------------------
-- 3b) Yedekten geri yükleme: artık yalnızca yönetici,
--     kontrol TRUNCATE adımından ÖNCE çalışır.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_from_backup(p_backup_id bigint, p_table_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_backup_timestamp timestamptz;
  v_backup_suffix text;
  v_tables_to_restore text[];
  v_table text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  -- Get backup info
  SELECT backup_timestamp, tables_backed_up
  INTO v_backup_timestamp, v_tables_to_restore
  FROM public.database_backups
  WHERE id = p_backup_id AND backup_status = 'completed';

  IF v_backup_timestamp IS NULL THEN
    RAISE EXCEPTION 'Backup not found or incomplete: %', p_backup_id;
  END IF;

  v_backup_suffix := EXTRACT(EPOCH FROM v_backup_timestamp)::bigint::text;

  -- Get list of tables to restore
  IF p_table_name IS NOT NULL THEN
    v_tables_to_restore := ARRAY[p_table_name];
  END IF;

  -- Restore each table
  FOREACH v_table IN ARRAY v_tables_to_restore
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'backup_' || v_backup_suffix || '_' || v_table
    ) THEN
      EXECUTE 'TRUNCATE TABLE public.' || quote_ident(v_table) || ' CASCADE';
      EXECUTE 'INSERT INTO public.' || quote_ident(v_table) ||
              ' SELECT * FROM public.backup_' || v_backup_suffix || '_' || quote_ident(v_table);
      RAISE NOTICE 'Restored table: %', v_table;
    ELSE
      RAISE WARNING 'Backup table not found: backup_%_%', v_backup_suffix, v_table;
    END IF;
  END LOOP;

  RAISE NOTICE 'Database restore completed from backup: %', p_backup_id;
END;
$function$;

-- ------------------------------------------------------------
-- 3c) Sipariş özet istatistikleri: anonim kapalı,
--     yönetici ve personel açık (sipariş yönetimi ekranı personel tarafından da kullanılıyor)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_stats()
 RETURNS TABLE(total_count bigint, approved_count bigint, pending_count bigint, total_amount numeric, pending_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin_or_staff_user() THEN
    RAISE EXCEPTION 'Forbidden: admin or staff role required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE status IN ('approved', 'completed'))::bigint AS approved_count,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending_count,
    COALESCE(SUM(amount), 0)::numeric AS total_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::numeric AS pending_amount
  FROM public.orders
  WHERE deleted_at IS NULL;
END;
$function$;