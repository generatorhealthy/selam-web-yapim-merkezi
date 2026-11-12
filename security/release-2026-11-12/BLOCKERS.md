# Somut üretim geçişi kontrol listesi — 12 Kasım 17:07 isteği

## 1. Test sistemi

**Tamamlanan kod:** Üç gerçek ekranın aday kopyasında TestStartGate soru/kişi alanlarını açmadan önce sunucu hazırlığı yapar. Hesap kullanıcısında önce getUser+scoped grant; misafirde yayımlanmış metin, CAPTCHA ve atomik tek-kullanımlık kanıt/limit. Sonuç+outbox atomik; alıcı kayıtlı uzman; UI sonuçları ile puanları e-posta veya navigation state'e koymaz. Ayrı sonuç ekranı yalnız tamamlanma bildirimi içerir; detaylar yetkili panelde kalır. Üretimdeki 12 sonuca backfill yok.

**Puanlama kanıtı:** Canlıdan yalnız toplu metadata okundu: 1.421 aktif test; 16.964 soru, tamamı multiple_choice; 16.882 soru 5 seçenek, 82 soru 4 seçenek; 1.682 soru nesne seçenekli; sayısal value içeren test yok, tests.content dolu değil. Bu verilerden klinik ölçek eşikleri veya ters puanlama çıkarılamaz. SQL ordinal puan ve gerçek seçenek sayısına göre maksimumu tutarlı hesaplar; risk/tanı uydurmaz. Gerçek klinik ölçek bazlı puanlama tamamlandı denilemez. Kullanıcıdan test başına doğrulanmış puan anahtarı/ters maddeler/yorum aralıkları gerekir.

**Eksik bağlantılar:** Ayrı test Supabase; iki yayımlanmış test-only belge; CAPTCHA test site/secret/hostname; global misafir kotası (aynı hostname altında paylaşıldığı için meşru kullanıcıların engellenmesi riski var, kişiye özel limit diye sunulmaz); scheduler secret; staging fonksiyon packaging `_shared` importları. MobileSignup/PatientSignup/uzman kayıt callback ve OS secure receipt saklama bağlantıları henüz ekran düzeyinde tamam değil.

**Geçen test:** 13 Deno testi; tüm aday ekranlar TS-only kontrolünden geçti; Deno adapter kontrolü geçti. PostgreSQL 20-paralel submit/claim/withdraw/finalize, seçenek maksimumu, ilgisiz uzman reddi, configured synthetic quota=3 ve tek CAPTCHA kanıtı geçti. Gerçek CAPTCHA/Brevo/cihaz testine eşit değil.

**Risk/onay:** Mevcut test fonksiyonu tek başına değiştirilmedi. Test ekranları, SQL, provider worker ve legacy yolları birlikte staging'de doğrulanmalı; sonra ayrı üretim onayı. CAPTCHA yeni dış sağlayıcı olduğundan hukuki aktarım envanterine ayrıca eklenmeli; ülke/güvence varsayılmamalı.

## 2. Onay sistemi

**Tamamlanan kod:** SDK signup/OAuth/callback adaptörü, server prepare_pending_consents, doğrulanmış e-posta hash eşleşmeli finalize, 20 paralel finalize için tek olay+fiş tüketimi aynı transaction. OAuth email fişini otomatik tüketmez, yeni teyit ister. Ayrı withdrawal önceki metin snapshot'ından çalışır; katalog kapalı olsa da geri çekme engellenmez. 57 kayıt için değişiklik yok.

**Eksik bağlantılar:** Gerçek kayıt ekranlarında bağımsız amaç kutuları, test-only e-posta inbox bağlantısı, native secure receipt saklama, callback recovery/resume ve lost receipt halinde yeniden teyit. Pending prepare/finalize kodu gerçek hosted Auth ile çalıştırılmadı. Genel üyelik için aydınlatma delivery kanıtı ayrı modellenmeli; health grant yerine sayılmamalı. Mevcut SQL katalog versiyonları silinmeyecek/değiştirilmeyecek şekilde korunmalı; yayımlanmış metinlerin immutable snapshot kuralı packaging sırasında zorunlu.

**Eski mobil stratejisi:** Yeni sürüm önce sunucu geçişini destekleyecek. Eski binary örneğiyle sentetik hesap testi, duyuru/güncelleme erişimi ve uyumluluk süresi hukuk/operasyon onayıyla belirlenecek. Sürüm header'ı güvenlik kanıtı sayılmaz. Sunucu INSERT kapatma ancak bütün testler ve ayrı onaydan sonra; sessiz kapanma/57 kaydı yeniden yazma yok. Desteklenmeyen eski kullanıcıya izinleri yeniden gösteren güvenli web alternatifi gerekir. Süre veya minimum sürüm numarası icat edilmedi.

## 3. Gerçek test ortamı

**Tamamlanan kod:** staging origin allowlist koruması ve gerçek oturumla uzman paneli readback test iskeleti; üretim adresi reddi test edildi. Docker olmayan sandbox'taki PostgreSQL sadece SQL testidir. `staging/PLAN.md` yeni boş test projesi, yalnız sentetik kullanıcı/SMTP, ayrı OAuth ve outbound kapalı kurulumunu tarif eder. Test altyapısı henüz provision edilmedi; test iskeleti çalıştırılmadı.

**Gerekli onay:** Yeni boş harici Supabase test projesi/ayrı app kopyası ve sağlayıcı maliyetleri; test SMTP/Google/Apple/CAPTCHA bağlantıları. Özel anahtarlar sohbetten istenmez, onaylı sır/bağlantı araçları kullanılacak. Mevcut üretim projesine ikinci ortam için migration veya auth config uygulanmayacak.

## 4. Mesaj

Yetkili referral modeli var. Public OTP/CAPTCHA/hız sınırı ekranının tam geçişi ve atomik OTP provider sözleşmesi henüz tamamlanmadı; “hazır” değil. Öncelikli test/onay altyapısıyla paylaşılacak. Üretim notify-patient-contact ve WAHA bağlantısı değişmedi; gerçek telefon sahipliği/taşıma için ayrı sağlayıcı ve test hattı gerekiyor.

## 5. Hukuki / yedek

Üç v2 metin byte-identical kaldı. Üç v3, `src/content/legal/2026-11-12-taslak-v3` altında ayrı ve SHA256SUMS ile oluşturuldu; hiçbir sayfaya import edilmedi. Almanya/Railway doğrulanmış gibi ifadeler kaldırıldı; saklama/aktarım güvenceleri ve fiilî güvenli e-posta geçişi tamamlanmış gibi gösterilmedi. KEP/MERSİS korundu. `legal-form-map.md` hedef ekran-amaç bağlantılarını ayırır; hukuki yayın ayrı onay bekler.

`backup-readonly.sql` 13 Kasım 16:00 UTC sonrası salt okunur cron23/24, metadata/RLS/grants kontrolleridir. Elle yedek/cron çağrısı yok; gelecek çalışma henüz doğrulanamaz. Gerçek yeni setin 12 tablosu ve tam kayıt sayımları çalışma sonrası metadata isimleriyle ayrı SELECT olarak tamamlanacak.

**Canlı değişiklik yok.** Tam üretim paketi tamamlandı iddiası yok. Öncelikli ilerlemek için gereken karar: ayrı boş staging kurulumu; sonraki gerçek cihaz/sağlayıcı kontrolleri ve klinik puanlama verisi.