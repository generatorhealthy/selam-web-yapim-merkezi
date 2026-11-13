# 13 Kasım 2026 — Kesin uygulama sonucu

Kontrol zamanı: 2026-11-13T15:28:50Z. Tam görev kapanmadı. Gerçek müşteriyle kabul, bildirim veya tahsilat testi yapılmadı.

## 1. E-posta olayı
- Önceki boş kontrol `send-accounting-notification` içinde dosya/dönem doğrulaması olmadan Brevo POST yaptı. Sabit muhasebe sorumlusu adresine gönderildi; alıcı istemciden gelmedi. Log ise yanlış biçimde genel admin adresini yazmıştı: bu yüzden log tek başına gerçek teslim alıcısı kanıtı değildir.
- Güvenli olay ID: `70688121-0512-44b9-b101-3101d715999b`, sunucu zamanı `2026-11-13T15:03:29.79634Z`, provider receipt mevcut. Toplam beş muhasebe logunda yalnız bir undefined konu var. Aynı kusurun başka gönderimlerini kesin dışlamak için sağlayıcı teslim kayıtları gerekir.
- Boş gövdeyle oluşturulan şablon müşteri/ödeme/sözleşme kaydı okumuyordu; eksik dosya/dönem ve sistem zamanı içeriyordu. Gerçek müşteriye ait veri veya yanlış/yetkisiz teslim **tespit edilmedi**, fakat alıcının fiilî yetkisi ve sağlayıcı teslimi ayrıca doğrulanmadı. Veri ihlali ilan edilmedi.
- Ekran görüntüsündeki kayıt e-postası ayrı yoldur: `send-registration-email` admin mesajını zorunlu alanlar olmadan gönderiyor, sonra eksik kullanıcı adresine auto-reply deniyor ve 500 dönebiliyordu. Önceki test kaydı bu uç için 500 içerir; fotoğraf zamanı aynı kontrollerle örtüşür. 101 başarı logunda undefined konu yoktur, ancak son kullanıcı gönderimi başarısızsa admin teslimi hiç loglanmadığı için bu sayı olayın olmadığını kanıtlamaz. Kesin çağıran kimliği doğrulanmadı.
- Yeni kayıt kontrolü eksik/geçersiz alanları sağlayıcıdan önce 400 ile reddeder. Muhasebe kontrolü 400→yetki→kayıtlı belge→sağlayıcı sırasındadır. Muhasebe logu bundan sonra gerçek sabit alıcıyla eşleşir; geçmiş log değiştirilmedi.
- Testlerde gerçek handler içindeki fetch ve SDK tamamen sentetik portlarla değiştirilir. Üretimde kamu dry-run anahtarı eklenmedi. Canlı önce yalnız GET, ardından sıfır yan etki testleri geçen iki boş POST kullanıldı; 400/400. Muhasebe logu hâlâ beş.

## 2. Fiyat
- Canlı yeni INSERT koruması yalnız doğrulanmış `ozel-firsat=4000` ve `kayit-linki=5000` tutarlarını zorlar; anon ve uzman daha düşük/farklı/null tutar yazamaz. Mevcut siparişler ve service/admin/staff işlemleri değişmez.
- **Bütün yollar güvenli değil:** bilinmeyen/eski paket tipiyle düşük pending sipariş oluşturma bütünüyle kapatılmadı. Bunları iki doğrulanmış fiyatın yerine otomatik eşlemek yapılmadı. Eski iyzico server Retrieve/receipt/settlement ve pending onay korumaları korunur; pending sipariş oluşturmak Premium kazanıldığı anlamına gelmez.
- Canlı packages: campaign 3600, campaign-premium 2398, discounted 1998, full 4998, premium 2998. Checkout campaign 2398, professional 3600, premium 4998; eski route discounted 1499/campaign-premium 3600 çelişkileri önceki incelemede var. Şirketin paket kimliği, fiyat, periyot/taahhüt ve hangi eski teklifin yeni satışa açık olduğu kararı gerekir. Son 45 gün ilk siparişlerinde yalnız 4000/5000 görüldü; bu diğer yolların kapalı olduğunu ispatlamaz.
- Kart seçeneği kapalı/havale açık; sağlayıcı plan çağrısı ve gerçek tahsilat yapılmadı.

## 3. Cayma
Tamamlanmadı: admin gate mevcut, fakat istemci subscriptionReferenceCode doğrudan retry'ye gidiyor, fee→order→signed contract ve atomik claim yok. Retry body amount taşımıyor: cayma bedeli tahsilatı olarak kabul edilemez. 391 kayıttan389'unda tutar boş/sıfır, yalnız2 referanslı; hiçbir kayıt değişmedi. iyzico ilişkisinin sona ermesi nedeniyle doğru tahsilat ürünü/yetkisi sağlayıcıyla teyit edilmeden yeni zorunlu tahsilat mekanizması etkinleştirilmedi.

## 4. Telefon
Tamamlanmadı: notify-patient-contact hâlâ kamu gövdesindeki telefon/link kullanıyor. Güvenilir sahiplik + normalize telefon + tekil claim ve timeoutta ikinci kanala kör fallback kaldırımı gerçek public UI ile birlikte entegre edilmeli. Bu bir uygulama eksikliğidir; mevcut randevu rate limit çözüm sayılmadı. Meşru anonim kullanıcı yolunu yalnız auth header zorlayarak kesmek yapılmadı; gerçek SMS/WhatsApp gönderilmedi.

## 5. Cron / WhatsApp
Tamamlanmadı: gerçek job2/11 aktif, postgres sahibi, x-cron-secret yok; mevcut sorgu rolünün cron.alter_job yetkisi false. Edge CRON_SECRET mevcut olması job'a dağıtıldığı anlamına gelmez. İşler durdurulmadı/elle çalıştırılmadı; sahip-yetkili güvenli header geçişi gerekir. SQL backup jobs HTTP header gerektirmeyen mevcut güvenli DB görevleridir; headersız tüm işler tek sınıf açık sayılmaz.
WAHA secret adı var fakat unsigned monitor kabulü sürüyor; gerçek sağlayıcı header kabulü ve yapılandırması doğrulanmadan enforce zorlanmadı. İmzasız mesajın güvenilir veri olarak yazılma riski açık.

## 6. Randevu
Önceki A koruması korundu; gerçek handlerda 20 eşzamanlı/tek gönderim ve3 saat gecikme, provider belirsizliğinde claim tutma yeniden sentetik geçti. Canlı authority toplamı0, ilk doğal teslim ve eski kanıtsız kuyruk envanteri yok; bütün meşru teslimler başarılı denemez.

## 7. Gerçek yayın
- send-registration-email source SHA256 `e0433c25c7608b346b03a31da0142dc250d8b06b9eebdf0e7896722b379ae020`: deploy başarılı, GET405/boş POST400.
- send-accounting-notification `70b99b6f68602b6a09e710faf09fbe8972626d644a7600b6405b3b17bb3109c3`: deploy başarılı, GET405/boş POST400. Admin/muhasebe ve belge normal yolu yalnız sentetik kabul; gerçek mail teslimi test edilmedi.
- send-support-response `9382c32092215bd12a24b7ac643b7e0d1bced59fbb3b542a4a1eeff1c85f5463`: deploy başarılı, GET401. Alıcı/yanıt/status/title stored ticket+owner'dan; istemci alanları yok sayılır. 32 gerçek ticket'ta specialist_id var; gerçek oturumlu normal teslim doğrulanmadı.
- guard_confirmed_offer_price migration canlı trigger tanımı doğrulandı; müşteri siparişi üretmeden exact SQL32 yerel kabul.
-32 Bun handler test +32 fiyat SQL +7 randevu SQL; mevcut yakalanmış RLS64 okuma/75 mutation ret tekrar geçti. Bunların tamamı tüm güncel DB/Edge matrisini veya gerçek hosted oturumu doğrulamaz.
-Son ölçüm:2747 sipariş,339 randevu,12 test,154 onay,0 makbuz; sipariş/sağlık/onay geçmişi değiştirilmedi. Yeni proje/branch, tarihsel replay, gerçek ödeme/mesaj yok. Build OK.160 önceki linter uyarısı kaldı, migration yenisini getirmedi.

## 8. Açık karar / uygulama bağımlılıkları
Şirket: çelişen satış key/tutar/periyotları ve muhasebe sabit alıcı yetkisinin teyidi. Sağlayıcı: doğru cayma işlem türü ve timeout/idempotency davranışı, WAHA gerçek header desteği/ayar kabulü, e-posta teslim envanteri. DB sahibi: cron header dağıtımı yetkisi. Uygulama eksikleri: telefon sahipliği/claim, bütün fiyat yolları, cayma bağları, kalan şablon/PDF ve hosted rol/alan tam matrisi. Bunlar yapılmadı; yalnız test toplamıyla kapalı gösterilmedi.

## Geri alma
Üç önceki mail handlerı rollback altında saklıdır; otomatik yeniden deploy edilmez (bilinen açıkları geri açar). Yeni fiyat guardı için rollback/offer-price.sql yalnız yeni trigger/fonksiyonu kaldırır; kayıt değiştirmez, yetkili onayla uygulanır. Önceki A/B/C, KVKK/çerez/CAPI ve eski mobil INSERT korundu.