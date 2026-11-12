# Doktorum Ol — 12 Kasım 2026 güvenlik hazırlığı

## Durum özeti

| Başlık | Durum | Doğrulama / kalan sınır |
|---|---|---|
| Yedek anonim erişim | Canlıda ve doğrulandı | Önceki yayında anonim RPC reddi doğrulandı; güvenli kapı korunuyor |
| Yeni kuralla doğal yedek | Canlıda, gerçek işlem doğrulaması eksik | 16:57 UTC kontrolünde son cron 23/24, 12 Kasım 16:00 UTC succeeded; yeni kuraldan önce. Sıradaki doğal çalışma 13 Kasım 16:00 UTC / 19:00 İstanbul |
| Test sonuç + outbox sunucu işlemi | Kod hazır, canlı değil | Gerçek yerel PostgreSQL: 20 paralel istekte tek sonuç/tek outbox; uzman eşleşmesi, erişim, revocation ve başarısız bildirimden bağımsız kayıt doğrulandı |
| Test istemci geçişi | Üç aday dosya hazır, canlı değil | TestTaking, TestTaker, MobileTestTaker kopyaları ortak adaptörü çağırır; çalışan src değişmedi; adayların TS kontrolü geçti |
| Test e-posta worker | Kod hazır, canlı değil | Yalnız kayıtlı uzman e-postası + sabit genel mesaj; hiçbir sonuç, cevap, puan, sağlık açıklaması, hasta adı/telefonu veya test başlığı sorgulanmıyor. Gerçek Brevo gönderimi yapılmadı |
| Yetkili danışan yönlendirmesi A | Taslak adaptör/model hazır, canlı değil | Sunucu getUser + rol + kayıtlı referral. Gerçek taşıma ve arayüz geçişi tamamlanmadı |
| Ziyaretçinin kendisine bağlantı B | Model ve test hazır; uygulama tamam değil | Telefon doğrulama sağlayıcısı, atomik OTP tüketimi, CAPTCHA/hız limiti ve gerçek cihaz deneyi gerekiyor |
| Hesap onayı ve geri çekme | Sunucu/istemci adaptörleri ve SQL hazır, canlı değil | Gerçek yerel SQL: katalog yayından kalksa da 20 paralel geri çekmede tek append-only olay; 57 sentetik legacy satırı değişmiyor |
| Kayıt öncesi beyan / eski mobil / misafir hesap bağlama | Tamamlanmadı | Pending prepare/finalize SQL, bütün kayıt ekranlarının entegrasyonu ve eski cihaz/sürüm geçişi eksik; doğrudan INSERT kapatılmadı |
| Metin yayını / hukuki aktarım ve faaliyet şartları | Hukuki işlem bekliyor | Üç metin yayımlanmadı; teknik test hukuki uygunluk ispatı değildir |

## Test paketi

`test/schema.sql`: işlem kimliğini sunucu oluşturur; tahmin edilemez 256-bit yetki değeri yalnız hash olarak saklanır. Testin sahibi veya etkin specialist_tests bağı doğrulanır; hiçbir ilk-aktif uzman seçimi yok. Genel testte güvenilir uzman bağı yoksa reddedilir. Hesap sahibi ve misafir ayrı kalır. Misafir işleminde sunucu seçili yayımlanmış belge anlık görüntüsü kaydedilir; bu telefon veya gerçek kimlik kanıtı değildir.

Sonuç ve outbox aynı SQL transaction içinde oluşur. Aynı işlem, aynı içerikte idempotent; değiştirilmiş cevapla tekrar reddedilir. Başarısız e-posta sonuç satırını silmez. Worker SKIP LOCKED ile tek hak alır. Timeout/5xx sonucu unknown; otomatik yeniden gönderim yok. 429 retryable; worker çağrı aralığı henüz onaylanmadı. Gönderim öncesi yapılandırma eksikse hiçbir kuyruk hakkı alınmaz.

Uzman panelindeki mevcut RLS predicate canlıdan salt okunur incelendi; yerelde ilgili uzman sonucu okur, ilgisiz uzman sıfır satır görür. Canlı uzman hesabı ile panel uçtan uca doğrulanmadı. Mevcut hasta e-posta eşleşmeli görüntüleme yollarının güvenlik geçişi ayrıca ele alınmalı.

### Yayın öncesi zorunlu açıklar
- İzin kutusu gösterimi ve server operation **cevap toplamadan önce** kurulmalı; mevcut adaylar tam sağlık veri toplama yayını olarak kabul edilmez. Hesap grant kaydı ile misafir beyanı aynı şey değildir.
- İstemci adayları mevcut son ekrandaki yerel risk/öneri hesaplamasını korur; SQL puanlaması genel multiple-choice örneğidir. Ölçek bazlı gerçek test puanlaması ve sonuç ekranı tutarlılığı doğrulanmadan yayınlanmaz.
- Misafir prepare kötüye kullanımını önleyen sunucu limit/CAPTCHA henüz uygulanmadı. İşlem kabiliyeti tekrar bildirimi önler, toplu yeni işlem yaratmayı önlemez.
- TestTaker kaynakta mevcut; güncel JSX kullanım eşleşmesi bulunmadı. Gelecekte kullanılacaksa aday dosya hazır, şu anda aktif kullanıcı akışı gibi raporlanmadı.
- Worker taslağındaki ortak testMail importu yayın sırasında `_shared` içine yerleştirilmeli; security dışı import otomatik deployment'a taşınamaz.
- Brevo için erişilebilir connector bulunmadı. Mevcut doğrudan entegrasyon değişmedi; canlı gönderici anahtarının türü/değeri ve sağlayıcı kabulü bu tur doğrulanmadı. Dedicated scheduler secret henüz eklenmedi; hazırlıkta gerçek sır gerekmedi.
- Güvenli test işlevi tek başına yayımlanmayacak. Şema → submit/worker uçları → bütün istemciler → gerçek test hesap/cihazı → eski çağrıları kapatma sırası; her canlı erişim/toplama adımı ayrı onay.
- Geçmiş 12 sonuç için outbox backfill yok; eski sonuçlara tekrar e-posta gönderilmez. Aynı operasyon tekrar idempotent; farklı operasyonlarla yeniden test yapma ayrı gerçek gönderimdir.

## Mesaj ve onay

`contact/RELEASE.md` iki modeli ayırır. Public kendime bağlantı işlevi kaldırılmadı. Özel hız sınırlama sayaçlarının maliyet/yanlış engelleme trade-off'u ve OTP sağlayıcısı netleşmeden B hazır sayılmaz. WAHA engelli hat ve bağlantı ayarları aynen bırakıldı.

`consent/adapter.ts` ve `client/lib/consentMigration.ts` yalnız doğrulanmış hesap/OAuth dönüşü için kullanılabilir. OAuth yeni teyit ister. Ayrı `withdrawal.sql` önceki belge anlık görüntüsünü kullanır; yeni katalog yayınına bağımlı değildir. Kayıt öncesi atomik finalize ve eski mobil geçişi tamamlanmadığı için 57 kayıt ve mevcut INSERT grant korunuyor. Bu açıklık sürerken güvenlik tamamlandı denilemez.

## Doğrulama

- Yeni Deno: 11 test geçti; test/consent worker/adaptörleri Deno kontrolünden geçti.
- Üç istemci adayı ve ortak adaptörler TS-only kontrolünden geçti.
- Yeni gerçek yerel PostgreSQL: 9 test gönderimi/erişim grubu + 2 geri çekme grubu geçti. 20-bağlantılı submit, claim ve withdrawal yarışları doğrulandı.
- Üretimde yalnız SELECT: 12 sonuç, test row_to_json hash `4c773e86e9ed778cfa6d07cdfedfa7c8`; 57 onay, to_jsonb hash `77f5332dc04de656d5408c528b771bf4`. İlk farklı hash sorgusu row_to_json kullandığı için serileştirme farkıydı; eski to_jsonb yöntemiyle değişmediği doğrulandı.
- Gerçek e-posta/SMS/WhatsApp/test yedeği gönderilmedi/oluşturulmadı. Gerçek mobil/Google/Apple/Brevo uçtan uca testi yapılmadı.

## Yedek doğrulaması bekliyor

Bu tur cron tetiklenmedi. Sonraki doğal çalışma sonrası yalnız SELECT ile job 23/24 sonucu, yeni setin 12 tablosu/kayıt tutarlılığı, RLS/yönetici sınırı, grants ve cleanup sonucu incelenmeli. Cleanup bağımsız iş değil, cron23 gövdesindeki çağrı; yeni gövde çalışmadan başarı varsayılmaz. Yetki hatası kritik raporlanmalı, anonim açığı açan rollback kullanılmamalı. Bu sohbet bitince arka planda kontrol çalışmaz; doğal çalışmadan sonra yeni kontrol gerekir.

Ödeme, abonelik, geçmiş sözleşmeler, hukuki deliller ve WhatsApp ayarları değişmedi. **Bu üç paket tam üretim geçişi olarak tamamlanmadı; şu anda canlıya alma onayı istenmiyor.** Önce belirtilen eksikler ve gerçek test ortamı doğrulaması tamamlanmalı, sonra ayrı yayın onayı sunulmalı.