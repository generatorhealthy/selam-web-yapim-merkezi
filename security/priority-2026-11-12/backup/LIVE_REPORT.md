# Yedekleme yetkilendirmesi — canlı uygulama raporu

12.11.2026, kullanıcı yalnız yedek düzeltmesini onayladı. Migration `20261112165350_7624c015-e514-4ea9-bd36-33fdbaa40037.sql` başarıyla uygulandı. Diğer consent/delivery SQL ve işlev taslakları yayımlanmadı.

## Doğrulandı
- Canlı anonim EXECUTE=false; authenticated/service_role EXECUTE=true, fonksiyon içi approved admin/trusted scheduler kapısı mevcut.
- Gerçek anonim PostgREST RPC isteği **401, SQLSTATE42501 permission denied** ile reddedildi; yedek oluşturmadı.
- Owner postgres, SECURITY DEFINER korunuyor; search_path pg_catalog,public,pg_temp.
- Cron23/24 etkin, kullanıcı postgres ve `0 16 * * *` aynı. Görev/cleanup değişmedi.
- 57 onay fingerprint `77f5332dc04de656d5408c528b771bf4` aynı; 12 test,341 randevu,3 set/36 yedek tablo korundu.
- Önceki izole gerçek PostgreSQL testleri yönetici/cron/server pozitif yolları ve yetkisiz negatif yolları, kayıt toplamı/grant/RLS ve güvenli rollback'i doğruladı. Canlıda gerçek yönetici manuel yedek çalıştırılmadı; test amaçlı kayıt oluşturulmadı.

## Bekleyenler
Yeni kapıyla ilk doğal cron çalışması henüz gerçekleşmedi; tamamlandığı söylenmez. Son doğal çalışma 12 Kasım16:00 UTC succeeded; değişiklik bundan sonra uygulandı. Yetkili gerçek yönetici oturum E2E bu harici Supabase ortamında yapılamadı.

Migration173 önceden var olan linter bulgusu bildirdi; yeni oluşmadılar ve bu onay kapsamında değiştirilmediler: mutable search_path1,public extension1,anon SECURITY DEFINER EXECUTE80,authenticated EXECUTE91. Bunlar ayrı güncel fonksiyon/rol değerlendirmesi gerektirir; hepsi otomatik gerçek açık sayılmaz.

Geri alma `safe-rollback.sql`: önceki iş gövdesi + yeni güvenlik kapısı/anon revoke; geçmiş kayıt silme veya anonim açığı yeniden açma yok. Gerekirse migration aracıyla uygulanır; otomatik geri alma yapılmadı.

Ödeme, abonelik, sözleşme, hukuki metin, test e-postası, danışan mesajı, consent INSERT ve WhatsApp değişmedi.