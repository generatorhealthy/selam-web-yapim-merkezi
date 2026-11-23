# Hoppa kart ödeme hatası: kapsam kontrolü

## Kural
Kartla devam edildiğinde Hoppa'nın ortak ödeme sayfası açılmalı. Açılmıyorsa gerçek engel anlaşılmalı; belirsiz sonuç yeni tahsilat veya ödeme başarısı sayılamamalı.

## Doğrulanan neden
23 Kasım 2026 10:47:54 UTC hoppa-subscription kaydı: Hoppa sunucunun çıkış IP adresinden işlem yapmasını reddetti. Bu, yanlış kart bilgisi hatası değil. Statik çıkış IP desteği bu ortamın bilgi kaynaklarından doğrulanamadı; tek gözlenen adresi izin listesine eklemenin kalıcı çözüm olduğu söylenemez. Hoppa'nın kabul ettiği güvenli bağlantı yöntemi teyit edilmeli; IP kısıtını kaldırma veya geniş ağ izni önerilmedi.

## Okunan yollar ve sonuçları
| Yer | Koddan doğrulanan davranış | Durum |
|---|---|---|
| /odeme/ozel-firsat, /odeme/kayit-linki, /odeme/:packageType, /odeme-sayfasi, /checkout, /checkout/:packageType; web ve mobil App tanımları | Hepsi aynı Checkout kullanır. Sipariş kaydı onaylanmadan Hoppa başlatılmaz; kart seçeneği ?kart=1 ile görünür. | Aynı sağlayıcı IP engeline tabi. Hata ayrıntısı 502 yanıtında ve istemcide kayboluyor. |
| İlk ödeme: hoppa-subscription start ve CommonPaymentDealer | Pending credit_card siparişinin sunucu tutarını kullanır, kart alanı göndermez. | Hoppa reddi genel hata oluyor. Değişmeyen formda ikinci tıklama submissionAttempt tarafından durdurulur; yeni ödeme denemesi sessiz kalır. Tekrarlı tahsilat koruması kaldırılmamalı. |
| Ödeme dönüşü: callback, ProcessQuery, ListCustomerCards | İlk ödeme sunucudan sorgulanır; başarılı olmayan ödeme siparişi onaylamaz. | Aynı çıkış bağlantısı kullanılır. Kart listeleme bağlantı hatası null/kart yokluğuna dönüşüyor; ayrı bağlantı hatası olarak ele alınmalı. Gerçek dönüş denenmedi. |
| /odeme-basarili ve /payment-success | Başarı başlığı oturum + RLS ile okunan onaylı kart siparişine bağlı. | Genel başarı koruması uygun. Ancak ?kart=kart-yok alt metni tek başına ilk ödeme alındı diyor; kanıtsız başarı ifadesi giderilmeli. Girişsiz kullanıcıda doğrulanmış başarı beklenmez. |
| /divan_paneli/kart-abonelikleri, admin retry | Aynı hoppa-subscription ve ortak istemci kullanılır; needs_review için tekrar düğmesi gösterilmez. | IP sorunu burada da etkileyebilir. 4xx/5xx ayrıntısı ekrana taşınmıyor. Gerçek yönetici oturumuyla işlem çalıştırılmadı. |
| Günlük otomatik tahsilat: recurring / chargeOne | Canlı cron hoppa-recurring-daily-v1 aktif, 0 7 * * *; recurring eylemini çağırıyor. Tekil charge_key; transport sonucu bilinmiyorsa needs_review, kör tekrar yok. | Aynı IP yetkilendirmesine bağlı. Kart listeleme hatası kart yokluğundan ayrılmıyor. Gerçek tahsilat çalıştırılmadı. |
| Ortak Hoppa istemcisi | CommonPaymentDealer, ProcessQuery, ListCustomerCards, EYV3DPay aynı ortam adreslerine POST yapar. | IP engeli yalnız ilk ödeme ekranıyla sınırlı kabul edilemez; diğer üç servisin canlı reddi ayrıca gözlenmedi. |
| DB guard_confirmed_offer_price | Yeni satışta credit_card ve bank_transfer kabul; fiyatlar sunucuda belirlenir. | Bu hatanın kaynağı değil. Canlı tanım okundu. |
| DB guard_payment_client_writes | İstemcinin paid/onay/işlem referansı yazmasını engeller. | Korunmalı; canlı tanım okundu. |
| DB activate_specialist_on_order_approval / auto_create_invoice_on_approval | Onay geçişi aktivasyonu ve fatura çağrısını tetikler. | Hoppa sayfası açılışını sağlamazlar. Canlı tanımlar okundu; tetiklenmedi. |
| DB hoppa_touch_updated_at / invoice_queue_update_only | Tarih güncellemesi / dar havale fatura kuyruğu kuralı. | IP sorunuyla ilişkili değil; canlı tanımlar okundu. |

## Değişiklik sınırı
Uygulama, Edge Function, izinler, cron, merchant ayarları ve geçmiş ödenmiş/gönderilmiş/iptal edilmiş kayıtlar değiştirilmedi. Gerçek müşteri bilgisi, test siparişi veya tahsilat gönderilmedi. Yalnız yerel testlerde iki Deno dönüş tipi hatası düzeltildi.

## Açık işler
1. Hoppa'nın güvenli sunucu IP yetkilendirme çözümünü teyit etmesi gerekiyor; sağlayıcı panel erişimi yok.
2. Hata aktarımı, kanıtsız alt metin ve bağlantı hatası/kart yokluğu ayrımı için bağımsız web/Edge yayın onayı gerekiyor. Otomatik dağıtılan dosyalar onaysız değiştirilmedi.
3. İzin çözüldükten sonra kullanıcının doğal işleminde hosted sayfa açılışı, ödeme dönüşü ve kart saklama uçtan uca doğrulanmalı. Yerel testler bu doğrulamanın yerine geçmez.

## 10:56 UTC onayı sonrası uygulama
- Checkout/admin hata aktarımı güvenli sınıflandırılmış kodlardan okunur; sağlayıcının ham metni kullanıcıya ve yeni hata günlüklerine aktarılmaz.
- Başarısız kart sorgusu boş kart listesi değildir. Otomatik çekim önce başarılı liste bekler; hata halinde charge claim/deneme tüketimi/tahsilat yok. İlk ödemesi ProcessQuery ile kanıtlanan ancak kart sorgusu belirsiz yeni abonelik needs_review olur, otomatik çekime girmez. Mevcut sonuçları kesinleşmiş abonelikler geri doldurulmadı.
- kart-yok URL metni doğrulanmış ödeme olmadan “ilk ödeme alındı” demez. Tekrar tıklamada yeni sipariş oluşturmadan mevcut siparişin teyidi istenir.
- 11 Deno + 6 Bun testi geçti. Sentetik Playwright akışında yalnız bir sipariş ve bir Hoppa isteği yakalandı; 502 IP açıklaması göründü, ikinci tıklama yeni istek üretmedi. Bütün Supabase istekleri yakalandı, gerçek müşteri/test siparişi/tahsilat gönderilmedi.
- hoppa-subscription başarıyla yayımlandı; gönderilen kaynak SHA256 b5663d2949cb0b9544f9bb25ab7988406f8b3ab202213f061902374a2253555b. Build OK. Gerçek hosted ödeme, yönetici işlemi ve Hostinger web yayını doğrulanmadı; IP yetkisi sağlayıcıda çözülmeyi bekliyor.
- İzin, cron, merchant ve geçmiş ödenmiş/gönderilmiş/iptal edilmiş kayıtlar değişmedi. Geri dönüş: bu onay paketinin önceki web/Edge kaynak sürümünü yeniden yayımlama; veri migration'ı yok.