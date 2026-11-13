# Kritik güvenlik kapanış kontrolü — 13 Kasım 2026

## Yayında ve doğrulanan dört düzeltme
1. Randevu onay e-postası yalnız kimliği doğrulanmış ilgili uzmanın kayıtlı randevusuna gönderilir. Tarayıcı alıcı, uzman iletişimi veya sağlık açıklaması gönderemez. İlgili uzman formu gerçek UUID gönderir; eski `temp-id` kaldırıldı.
2. Yeni service-only `appointment_delivery_claims` satırı sağlayıcıdan önce tüketilir. Yerel PostgreSQL'de 20 ayrı bağlantıda bir claim/19 tekrar; sağlayıcı belirsizliğinde claim korunur.
3. Sipariş belgeleri tam sipariş ID'sinden kayıtlı alıcı/ad/paket ve saklanmış imzalı metinleri okur. E-posta fallback ve tarayıcı metinleriyle signed snapshot değiştirme kaldırıldı. Alıcı alanı salt okunur. Başka uzmana elle gönderim bu endpointte artık desteklenmez.
4. Ücretli proxy sorgusu yalnız onaylı yönetici veya güvenilir sunucu yetkisiyle yapılır. `form_contents` kamu okuması yalnız `pre_info` genel sözleşme şablonuna daraltıldı; başka türler yöneticiye açık.

## Kanıt
- 46 Bun testi: yeni e-posta/ücretli proxy, mevcut banka/telefon/admin/BirFatura regresyonları; 0 başarısız.
- Ayrı 44 BirFatura/SSRF test ve 6 mevcut randevu yetkisi testi geçti (7 handler testi önceki 46 içinde de vardır; toplamlar benzersiz sayı diye toplanmaz).
- Yerel gerçek PostgreSQL: 20 bağımsız bağlantı tek claim, anon/authenticated yazı reddi, kamu şablonu/admin özel okuma.
- Üç yayımlanmış endpoint girişsiz boş POST için 401; hiçbir gerçek e-posta/SMS/WhatsApp/ödeme yapılmadı.
- Kayıtlar: 2747 sipariş, 339 randevu, 12 test; yeni delivery claim 0. Kayıt UPDATE/backfill/silme yok.
- En son otomatik derleme: build OK. Yerel ana sayfa açıldı; bu yetkili panel E2E değildir.
- Hızlı tarama 15 → 14; kritik 1 → 0, 8 warning/6 info kaldı. Bu yalnız hızlı DB taramasıdır; tüm sistem temiz değildir.

## Gönderilen kaynak SHA-256
- send-patient-appointment-confirmation: `a0e2ecaa5ee8b4fee213dc13947f7054f69e0cb5fe0880d383fb5cf52d0dccff`
- send-order-documents-email: `42e72fe08218ebbf302b1fa9442d5e102eb46edc08cb6df7a953f46587ab08c6`
- get-proxy-ip: `2be7db3115737a457cfdac1fc9bc3f18327b74cf634de62bd36f4a3320fcdc16`

## Hâlâ açık; tamamlandı denemez
- Cron 2/11/74 gerçekten anonim taşıma kullanıyor. Reminder, sitemap ve SEO cron dalının güvenilir gate geçişi için görev sahibiyle koordinasyon gereklidir. Meşru çağrıları sessizce kesmek veya halka açık JWT'yi sır saymak yapılmadı. SEO cron yetki atlaması devam ediyor.
- WhatsApp imzasız izleme kipi ve gerçek sağlayıcı başlık geçişi; Railway doğal olay kabulü olmadan çalışan hat kesilmedi.
- `update_registration_analytics` anon/authenticated EXECUTE hâlâ true; tahmin edilebilir session ID yetki kanıtı değildir. İstemci geçişi tamamlanmadan mevcut raporlamayı kıran iptal yapılmadı.
- Banka kanıtı hâlâ yönetici beyanıdır, banka kaynaklı işlem bağlantısı değildir.
- Eski mobil test INSERT ve üyelik izin INSERT geçişleri önceki ayrı onay/uyumluluk sınırlarında açık; bu tur kesilmedi.
- Harici Supabase gerçek admin/uzman oturumuyla pozitif belge/mesaj E2E mümkün değil; gerçek teslim yapılmadı. Yeni web değişikliklerinin Hostinger commit dağıtımı doğrulanmadı.
- Önceki 160 linter uyarısı ve tam derin tarama açık; eski bulgular blanket kapatılmadı. Bu tur dört doğrudan doğrulanmış bulgu fixed olarak işlendi.

## Güvenli geri alma
Eski anonim e-posta/proxy sürümüne dönülmez. Sorunda yalnız ilgili gönderim durdurulur; randevu ve sipariş kaydı bağımsız kalır. Delivery claim silinmez; bilinmeyen teslim otomatik tekrar edilmez. Kamu şablonu korunur. Mevcut havale, geçmiş abonelikler, cayma kapalı, sağlık release kapalı ve Paket B/C değiştirilmedi.