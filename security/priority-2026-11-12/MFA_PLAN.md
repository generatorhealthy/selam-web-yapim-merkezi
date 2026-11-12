# Yönetici MFA — hazırlık, etkinleştirilmedi

Mevcut Supabase MFA kaydı önceki salt okunur sayımda 0; ayrı SMS/OTP doğrulamasının MFA eşdeğeri olduğu kanıtlanmadı. Sunucuda onaylı yönetici rolü (korumalı rol kaynağı), JWT `aal2` ve Supabase factor verification kullanılacak; tarayıcı storage değeri güvenilir değil.

1. Önce gönüllü TOTP kayıt ekranı; QR/TOTP sırrı yalnız sahibi ekranda, log/analitik/URL'de yok. Başarılı challenge/verify ve ikinci oturum teyidinden sonra 'hazır'. Telefon OTP tek başına rol vermeyecek.
2. İsteğe bağlı 10 yüksek entropili tek kullanımlık kurtarma kodu. Sunucu 128-bit rastgele üretir; yalnız ilk gösterimde ham değer, DB'de pepper+hash. Kodlar kopya loglanmaz; hesap+purpose bağımlı, atomik tüketim; aynı kodla 20 paralel istek sadece biri. Secret pepper mevcut değil; bu tur secret oluşturulmadı, kod üretim sistemi etkinleşmedi.
3. Supabase yerleşik recovery-code desteği varsayılmaz; kodu `aal2` token basma hilesi olarak kullanma. Kurtarma kodu yalnız doğrulanmış mevcut parola/e-posta + kayıtlı kurtarma faktörü/insan inceleme akışını başlatır; TOTP silme/yenileme ve AAL2 yeniden doğrulaması server admin işlemiyle, denetim kaydı ve bildirimle yapılır. Doğru rol/mümkün API prosedürü sandbox testte doğrulanmalı.
4. Yönetici cihaz kaybı: e-posta eşleşmesi tek başına yetmez. Kimlik ve mevcut şirket yetkilisi doğrulaması, en az iki yetkili onayı, bekleme, eski faktör iptali, tüm oturumları geçersizleştirme, yeni faktör kurulumu; işlem yetkisiz çalışan tarafından yapılamaz. E-posta/telefon değiştirme aynı işlemde yapılmaz.
5. En az iki yönetici kurtarma planını test etmeden zorunlu geçiş yok. Gönüllü kurulum → AAL2 testleri → veri değiştirmeyen izleme → kullanıcının ayrı canlı onayı → kademeli enforcement. Cron/service webhook MFA kullanıcı akışından bağımsızdır; otomasyon durdurulmaz.
6. Geri alma: enforcement kapısına onaylı kısa süreli break-glass, server-side audit ve iki yetkili kontrolü; mevcut faktör veya kurtarma kayıtlarını silme, client rol bypass açma. Geçiş gerçek yöneticileri erişimsiz bırakmamalı.

**Durum:** tasarım hazır; gerçek MFA/kurtarma kodu işlevleri, kullanıcı kurulumu ve zorunlu enforcement yapılmadı.