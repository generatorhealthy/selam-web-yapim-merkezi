# Kalan 11 uyarı — hazırlık sonucu
Tarih: 2026-11-14T07:39:23Z. **Canlı yayın yapılmadı.** Planın onayı hazırlık içindir; her canlı paket ayrıca onay bekler. Mevcut app, Supabase işlevleri, migration ve bağımlılıklar değiştirilmedi.

## Madde bazlı kesin durum
| Uyarı | Mevcut durum | Bu turun çıktısı | Canlı kapanış |
|---|---|---|---|
| Blog talimatları | Kaynakta system sabit, specialty user JSON | Gerçek mevcut handler ile 2 regresyon geçti | Deployed kaynak eşleşmesi/yeniden tarama doğrulanmadı; kapatılmadı |
| Destek e-postası | new-ticket-notification hâlâ kullanıcı HTML/kimlik alıyor; web boş ticketId gönderiyor | Kayıtlı talep→uzman sahibi, escaped HTML, info gönderen, legacy tekil 15dk eşleşme, service-only claim ve SDK adayı | Ayrı migration+function+web yayın onayı |
| Yönetim AI URL | exact HTTPS host allowlist, redirect:error | Mevcut yardımcı SSRF testleri geçti | Mevcut deployed kaynak eşleşmesi ayrıca gerekir |
| Yönetim AI rol | validChatHistory user/assistant kısıtı mevcut | system/developer/tool/function ret testleri geçti | Yardımcı testi gerçek yetkili sohbet kabulü değildir |
| Cayma bedeli | Mevcut handler admin doğrulayıp 409; sağlayıcıya erişim yok | 20 paralel çağrı ve yetki testleri geçti | Özellik kapalı kalır; tarama eski kaynak eşleşmesi teyitsiz |
| Eski atıf oturumları | public track_lead_event mevcut anonim session ile yazabiliyor | Sunucu rastgele oturum +256bit token/hash, yalnız service atomic RPC; eski kayıt koruma testleri | SQL/Edge/web paketi ayrı onay; eski istemci olayları reddedilir, müşteri kaydı korunur |
| Ödeme durum sorgusu | create-iyzico-payment farklı durum cevaplarıyla order okuyor | Sipariş/sağlayıcı okumayan sabit kart-kapalı handler | Yalnız yeni initialize endpoint yayını onayı; callback/yenileme aynı |
| Randevu onayı | Canlı trigger'larda INSERT approval gate yok | Additive BEFORE INSERT gate; anon ve ilgisiz authenticated confirmed/created_by_specialist/başka patient UUID reddi | Ayrı migration onayı; slot/rate/cancel/notification mevcut kalır |
| Panel SMS | Mevcut 3 transport approved panel için arbitrary phone/message kabul ediyor | Kayıtlı specialists.phone + personel sabit şablon/admin-only custom; shared persisted request claim + SDK; unknown retry yok | Üç transport ve panel birlikte ayrı onay; özel appointment/referral/server akışı uyumu gerekir |
| Eski mobil test INSERT | Önceki kararla açık | Değiştirilmedi | Gerçek yeni mobil sürüm/eskiden geçiş ve açık kapatma onayı |
| Eski mobil üyelik izin INSERT | Önceki kararla açık | Değiştirilmedi | Aynı; eski onaylardan sağlık rızası türetilmez |

## Testler
- 56 Bun testi / 115 assertion geçti: aday işlevler, SDK adaptörleri ve mevcut blog/AI guard/cayma regresyonları.
- Yerel gerçek PostgreSQL: 36 kural kontrolü, 20 paralel support ve 20 SMS claim'de birer kazanan; anon/auth private claim erişimi reddi, gerçek yerel owning specialist/admin/service olumlu INSERT, eski satır koruması, token/owner/expiry reddi.
- Yeni uygulama veya deploy edilmiş işlev değişmedi; harness build log 07:39:11 UTC build OK. Hosted preview son commit build'i başarılı.
- Gerçek hesap oturumu external_unmanaged; yetkili üretim paneli/mobil/Brevo/Verimor olumlu teslim denenmedi. Yerel SDK akışı gerçek müşteri E2E değildir.
- Gerçek SMS, e-posta, WhatsApp veya ödeme gönderilmedi; canlı iş verisine yazılmadı. Salt-okunur doğal sayımlar: orders2749,appointments339,tests12,consents204. Önceki consent154'tan doğal artışın sebebi bu paket değildir, kökeni doğrulanmadı.

## Project monitoring uyumluluk maddesi
Canlı sorguda uzman test bildiriminin x-cron-secret içerdiği görüldü; eski bulgunun test SMS kısmı eski tanıma dayanıyor. Uzmanın oluşturduğu randevunun hasta SMS dalı hâlâ yalnız public JWT kullanıyor. Bu gerçek uyumluluk eksikliği açık; anonim SMS açılmayacak. Salt okunur doğal trigger enqueue/teslim kanıtı yok, bulgu kapatılmadı. Diğer card retry ve PBX boş sütun maddeleri bu 11 uyarı paketinin dışında bırakıldı.

## Bağımlılık denetimi
Üretim lockfile 86 paket tarandı; mevcut Capacitor native sürümleri, CLI transitive bağımlılıkları ve jsPDF için critical/high advisories mevcut. Bu tur bağımlılık değişmedi. Mobil bütünlüğünü ve PDF/sözleşme çıktısını doğrulamadan major upgrade yapılmadı. Bu riskler 11 endpoint uyarısından ayrı ve açık; sistem temiz ilan edilmez. Native fix mağazadaki eski binary'yi otomatik onarmaz. Ayrı uyumluluk/dağıtım onayı gerekir.

## Yayın ve geri alma
1. Önce support paketi: service-only claim migration→legacy-compatible function→web gerçek ID. İşlem sonucu/rollback ayrı sunulur. Claim kayıtları geri almada silinmez; unknown teslim yeniden gönderilmez. Eski vulnerable function'a dönmek güvenli rollback değildir; gerektiğinde mail kapalı güvenli yanıt, destek kayıtları açık.
2. Kart sorgusu: mevcut public initialization yerine cardStartHandler entry; UI havale aynı. Geri almada kart-kapalı sabit cevap korunur; provider initialize tekrar açılmaz.
3. Randevu gate: yalnız yeni INSERT trigger eklenir. Eski kayıtlara UPDATE yok. Yetkili yolların hosted kabulü gerekir. Rollback gerekirse gate kaldırma yeni güvenlik riski taşır; önce durumu incele, otomatik unsafe rollback yok.
4. Atıf: authority ve atomic RPC→server→web session client; en son eski public writer revoke. Eski client için takip kaybı olabileceği açık kabul edilir; tarihsel satırlar dokunulmaz. Rollback server writer/capture kapalı, eski public write tekrar açılmaz.
5. SMS: özel bildirim/server çağrıları envanteri→3 transport ortak browser gate→panel şablon/ID; yetki hatası/unknown'da fallback yok. Eski auth gate'e otomatik geri dönülmez; güvenli sunucu gönderimleri korunur.

`candidates/web-support.txt` ve `web-sms.txt` uygulanacak dar web farklarıdır; henüz app'e uygulanmadı. `lead-adapter.ts` gerçek service-only RPC ile dispatch; `lead.ts` enjekte mantık test adayı. Abuse/rate limit yeni public session issuance için ayrı host kabulünde değerlendirilir. SQL migration dosyası henüz oluşturulmadı; aday SQL yalnız security altındadır.
