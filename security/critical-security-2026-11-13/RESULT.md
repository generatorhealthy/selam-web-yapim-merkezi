# Kritik güvenlik A–H — 13 Kasım 2026

Bu görev tamamlanmadı. Önceki test toplamları tekrar kabul kanıtı olarak kullanılmadı. Yeni test: 13 Bun, 7 yerel PostgreSQL kontrolü; Deno check ve gözlenen build OK. Gerçek müşteriyle test yok. Yeni ortam/branch veya tarihsel migration replay yok.

| Paket | Doğrulanan açık | Düzeltme | Test | Canlı | Meşru işlev kontrolü | Kalan engel |
|---|---|---|---|---|---|---|
| A | enforce=false public JWT bildirim kabulü | DB trigger 256-bit rastgele randevu tokenı üretir; yalnız hash saklanır, service-only RPC 24 saat doğrular. Payload alıcıları kullanılmaz. Atomic claim korunur; belirsiz sağlayıcı yanıtında kilit silinmez. | 6 gerçek handler testi; 20 çağrı tek gönderim; 7 yerel SQL rol/trigger/expiry kontrolü | Trigger/RPC/tablo ve send-appointment-notification dağıtıldı; geçerli UUID/token biçimli iki yetkisiz istek 401 | 3 saat gecikmiş trigger ve mevcut SMS alıcıları sentetik geçti | İlk doğal sağlayıcı teslimi doğrulanmadı; önceki sürümde kuyruğa girmiş tokensız istekler artık reddedilir, bunların envanteri yapılmadı |
| B | Tarayıcı tutarı yeni INSERT'e giriyor | Henüz uygulanmadı; yanlış katalog eşlemesi yapılmadı | Kaynak ve güncel katalog karşılaştırıldı | Hayır | 4000 ozel-firsat / 5000 kayit-linki son 45 gün doğal kayıtlarında görüldü | campaign katalog=3600/checkout=2398; campaign-premium katalog=2398/route=3600; premium katalog=2998/checkout=4998; discounted katalog=1998/route=1499. Teklif önceliği ve 12/24 aylık sözleşme bağının kesinleşmesi gerekli |
| C | Admin rastgele subscriptionReferenceCode gönderiyor; claim yok | Henüz uygulanmadı | Gerçek handler ve fee şeması incelendi | Hayır | Tahsilat yapılmadı | /operation/retry gönderimi amount taşımıyor; bu API cayma bedeli tahsilatı olarak doğrulanamaz. Bazı otomatik fee kayıtları amount=0 ve abonelik/sözleşme bağı yok. Geçerli tutar/sözleşme ve doğru sağlayıcı işlemi gerekir |
| D | Cron 2/11 ve bazı eski işler public JWT | Randevu trigger A ile bağlandı; cronlar değiştirilmedi | Gerçek job 2/11 owner=postgres; mevcut rol alter_job EXECUTE=false | A dışında hayır | Mevcut joblar aktif bırakıldı, elle çalıştırılmadı | DB sahibiyle güvenli secret dağıtımı ve job komut geçişi; Vault boş. CRON_SECRET Edge'de var, değeri kopyalanmadı/saklanmadı |
| E | WAHA unsigned monitor kabulü | Değiştirilmedi | Gerçek guard/source incelendi; WAHA_WEBHOOK_SECRET adı mevcut | Hayır | Gerçek sağlayıcı başlık/mesaj kabulü yok | Sağlayıcıdaki webhook yapılandırması ve güvenilir imza/başlık desteğinin gerçek doğrulaması |
| F | Kamu arbitrary phone/link gönderimi | Değiştirilmedi | Handler incelendi | Hayır | Kamu iletişim yolu kesilmedi | Telefon sahipliği ve güvenilir başvuru/tek kullanımlık gönderim bütçesi entegrasyonu gerekiyor; IP limiti çözüm sayılmadı |
| G | Kayıt/kariyer/muhasebe/consent HTML; specialty system interpolation | HTML değerleri escape; blog system sabit, konu JSON user verisi ve uzunluk/tip sınırı; eksik muhasebe dosya/dönem 400 | 5 gerçek mail handler + 2 blog testi; sentetik sağlayıcı/model | 5 işlev dağıtıldı; A randevu HTML de düzeltildi | Mevcut şablon/alıcı/sender ve normal model isteği sentetik korundu | Diğer e-postalar ve sözleşme/PDF server escape yolları bitmedi; kamu mail yetkisi/alıcı bağı tamamlanmadı |
| H | Güncel kişisel tablo erişimleri ve legacy INSERT | 12 tablo canlı politika karşılaştırması; A tablosuna anon/auth GRANT kapalı | A tablo/verify yetkisi canlı false; diğer rollerde yeni tam matris yok | Yalnız A yeni erişim kuralları | Gerçek yetkili belge/panel oturumu yok | Tam tablo/kolon/rol matrisi ve oturum kabulü eksik; legacy test INSERT bilerek korunur |

## Sekiz kesin cevap
1. **Randevu bildiriminde geçerli biçimli yetkisiz istek reddediliyor: evet, 401.** Uygulama/sunucu tarafında real UUID bilmek yeterli değil. Canlı negatif kontrol sentetik UUID ile yapıldı, gerçek randevu test için kullanılmadı.
2. **Düşük tutarlı yeni sipariş engeli tamamlanmadı.** Tarayıcı tutarı INSERT'te hâlâ güvenilir katalog tarafından zorlanmıyor. iyzico plan/tutar/settlement kapısı korunuyor, banka havalesi tek görünür seçenek.
3. **Başka abonelik referanslı cayma bedeli riski açık.** Admin gate var ancak server fee/order/subscription binding ve atomik claim yok.
4. **Cron ve webhookların tamamı güvenli yetkilendirilmedi.** A trigger tamam; cron 2/11 ve WAHA geçişi eksik.
5. **Rastgele telefon SMS riski tümüyle engellenmedi.** notify-patient-contact geçişi eksik.
6. **Mevcut sistemin bütün gerçek işlevlerinin çalıştığı doğrulanmadı.** İşler/kayıtlar/üyelikler topluca değiştirilmedi; A ve G meşru yolları yalnız sentetik kontrol edildi. Eski kuyruğa girmiş A çağrı kaybı ölçülmedi.
7. **Bu tur dağıtılanlar:** A trigger + capability tablo/RPC + service-only policy/revoke; send-appointment-notification; send-registration-email; send-accounting-notification; send-disclosure-consent-email; send-career-application; generate-blog-content. Diğer önceki güvenlik düzeltmeleri korunur.
8. **Açık kritik engeller:** B fiyat/teklif/sözleşme eşleşmesi; C güvenilir abonelik/tutar ve idempotency; D job sahibi/secret dağıtımı; E provider kaynak doğrulaması; F telefon sahipliği; G kalan şablon/sözleşme/alıcı bağı; H legacy ve tam rol matrisi.

## Beklenmedik canlı etki — gizlenmedi
Boş muhasebe POST'unun zararsız ret kontrolü sanılması yanlıştı: handler validation içermediği için gerçek alıcıya **bir muhasebe e-postası gönderdi** (200). İşlem kontrolü durduruldu. Aynı işlevde dosya adı ve dönem zorunlu doğrulaması eklendi; 3 eksik/geçersiz sentetik gövdede sıfır sağlayıcı çağrısı test edildi ve işlev tekrar dağıtıldı. Son canlı boş POST 400. Bu nedenle “gerçek e-posta hiç gönderilmedi” denemez. Gerçek SMS/WhatsApp/ödeme gönderilmedi; müşteri test kaydı oluşturulmadı. E-posta logu doğal işlev tarafından yazılmış olabilir, silinmedi.

## Kayıt sınırı ve tarama
Salt okunur son ölçüm: orders=2747, appointments=339, test_results=12, user_consent_logs=154. Son toplam önceki 112'nin aynısı değildir; bu görev onay yazmadı, artışın nedeni ayrıca doğrulanmadı. Yeni A authority=0; mevcut satırlar taşınmadı/değiştirilmedi. Paket B/C sağlık bildirimleri, KVKK sayfaları, consent/CAPI ve kapalı AI sesli asistan değiştirilmedi.
Derin tarama tamamlandı; telefon bildirimi, unsigned WhatsApp, ücret/subscription, mail HTML/log, attribution, RLS ve eski endpoint bulguları verdi. Bulguların bir bölümü önceki kaynak durumuna ait (ör. daha önce düzeltildiği doğrulanan CSV/Brevo/Doki) ve nesne bazlı tekrar doğrulamadan kapatılmadı. 160 mevcut DB linter bulgusu bu migration öncesinden kalır; 160 kritik açık anlamına gelmez. Yeni A RLS uyarısı service-only açık policy ile giderildi; son migration yeni uyarı eklemedi.

## Geri alma ve teslim sınırı
A token üretimini kaldıran eski trigger/anon handler'a geri dönülmez. İlgili handler'ın içerik/transport kısmı geri alınabilir, capability doğrulaması ve trigger tokenı korunur. Provider belirsiz claim manuel mutabakat olmadan silinmez. G HTML kaçışını kaldırmadan şablonun önceki tasarımına dönülebilir; eski kayıt/sözleşme yeniden yazılmaz. Cron joblar çalıştırılmadı/durdurulmadı. Gerçek ilk doğal teslim, hosted panel oturumu ve sağlayıcı kabulü yok; sentetik kabul tam üretim E2E değildir.

## Kaynak yayın özetleri (SHA-256)
- send-appointment-notification: 3966c6d1e3628141b975eeaf35f5e5f0ff48699eabfd4fb91009afacab6bcbd6
- send-registration-email: c2b1bcfdc14fc7078cc448ba4112785092d941b0fa45c059d5d85239f2a93d2e
- send-accounting-notification (son): 2826ffdc0f74071399221896450e3378c4e4c97bc432a73fb7a0cf5556445812
- send-disclosure-consent-email: 8510b8a75f5e20afd303315044b7721b128dfc98aa0310712a94c603e8329522
- send-career-application: bf65fde67c1cf6f8a196a7025aaa484dadd4d9ef698bd4d3c11032d08d5fd796
- generate-blog-content: 502c6e09fc6b0d234b5d47591b108c26c9acfcf92ed768dd35b6a7e6c0f00dc9