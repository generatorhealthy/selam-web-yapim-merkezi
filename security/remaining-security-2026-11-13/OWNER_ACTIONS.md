# Aşama 5 — hesap sahibi işlemleri ve kabul sınırları

## WAHA / Railway: önce salt okunur kanıt

1. Railway → mevcut WAHA servisi → Settings → Source: kullanılan Docker image tag/digest kaydedilir. Deployments → aktif deployment → Logs: sürüm/engine başlangıç bilgisi kaydedilir. Sır veya QR paylaşılmaz.
2. Railway → aynı servis → Variables: mevcut `WHATSAPP_HOOK_URL`, `WHATSAPP_HOOK_EVENTS`, `WHATSAPP_HOOK_CUSTOM_HEADERS` ve global webhook kullanımı kontrol edilir; değerler sohbete kopyalanmaz. Oturum bazlı webhook için WAHA Dashboard → Sessions → ilgili oturumun config/webhooks ayarı incelenir. Global webhooklar GET /api/sessions içinde görünmeyebilir.
3. Resmî belge `config.webhooks[].customHeaders`, `hmac.key`, global `WHATSAPP_HOOK_CUSTOM_HEADERS` ve `WHATSAPP_HOOK_HMAC_KEY` destekler: https://waha.devlike.pro/docs/how-to/events/ . Bu, kurulu sürümün aynı desteğe sahip olduğunu kanıtlamaz. Kamu `/api/version` kontrolü 404 verdi; gerçek sürüm doğrulanmadı.
4. Kurulu sürüm `customHeaders` destekliyorsa mevcut alıcının tanıdığı `x-waha-token` ve aynı `WAHA_WEBHOOK_SECRET` kullanılır. Oturum yapılandırmasındaki yalnız Doktorum Ol webhookuna eklenir; URL/events/retries ve başka alıcılar korunur. Global kullanımda mevcut custom header listesine eklenir, listede olanlar silinmez.
5. Paylaşılan sır yalnız güvenli form ve Supabase → Edge Functions → Secrets ortamında saklanır; Railway global değişkeni veya WAHA oturum ayarı aynı değeri güvenli panelden alır. Mevcut sırrın okunabildiği varsayılmaz; değişim gerekiyorsa iki taraf için koordineli güvenli form gerekir. Yeni header adı uydurulmaz.
6. Önce mevcut izleme kipinde doğal gelen olayın `signed` kabulü ve beklenen tek kayıt doğrulanır. Üretimde deneme mesajı gönderilmez. Bundan sonra ayrı geçişle `WAHA_WEBHOOK_ENFORCE=true` etkinleştirilir. Meşru olay kabul edilmeden anahtarsız trafik kesilmez. HMAC seçilirse mevcut alıcı SHA512 raw-body doğrulaması yapmadığı için sadece sağlayıcı HMAC ayarını açmak yeterli değildir; alıcı değişikliği ayrıca gerekir.

## Cron 2 / 11: sahip-yetkili geçiş

- Panel: Supabase → Integrations → Cron → Jobs. Mevcut job 2 `generate-sitemap-daily`, `0 3 * * *`; job 11 `send-appointment-reminders-hourly`, `0 * * * *`; ikisi aktif, sahibi `postgres`.
- Mevcut bağlantının `cron.alter_job` yetkisi yok. Aynı başarısız değişiklik tekrarlanmadı. Yedek işleri değiştirilmez.
- Panel: Supabase → SQL Editor, veritabanı sahibi oturumu; hedef işlevde doğrulanan cron yetkisi ile aynı güvenli secret kaynağı kullanılmalıdır. Edge `CRON_SECRET` varlığı job'a dağıtım kanıtı değildir. Sır job metnine veya sohbete yazılmaz. Güvenli geçiş için sahip yönetiminde sır erişimi gerekir; hazır olmayan erişimi atlayan alternatif yoktur.
- Önce hedeflerin güvenli yeni alıcı sürümü ve bağımlılık testleri; sonra farklı isimli yeni görevler aynı schedule ile hazırlanır. Yeni görev devreye girerken eski görev `active=false` yapılır; hiçbir zaman iki görev aynı anda aynı bildirimi göndermez. `cron.job` silinmez.
- Doğrulama: Cron → Run history üzerinden ilk doğal çalışmanın HTTP sonucu ve hedef logunun yetki kabulü karşılaştırılır. Manuel reminder çağrısı gerçek SMS gönderebilir; yapılmaz. Sorunda eski görev yalnız güvenli geçiş/geri alma planına göre tekrar etkinleştirilir. Şu an iki hedef kaynakta in-code cron kapısı bulunmadığından job header değişikliği tek başına açığı kapatmaz; alıcı kodu hazırlığı uygulama sorumluluğudur.

## Hostinger / GitHub: dağıtım kanıtı

- GitHub → ilgili repo → Actions → Deploy to Hostinger → son çalışma. Beklenen commit, Build project, Deploy application assets, Deploy supporting files, Activate release sonuçları kontrol edilir.
- Hostinger hPanel → Websites → doktorumol.com.tr → Dashboard → Advanced → Cache Manager. Gerekirse yalnız yayın sonrası cache temizlenir; bot koruması kapatılmaz.
- Actions başarısı gerçek tarayıcı kabulü değildir. `/boot.js` SHA-256 / Last-Modified ile tarayıcıda kayıt/profil/blog/randevu sayfaları ayrıca kontrol edilir. Bu ortamda GitHub veya Railway bağlantısı yok; bu hesaplara erişilmiş sayılmaz.

## Yetkili panel / özel belge pozitif kabulü

- Divan paneli: admin ve staff yetkileri ayrı; uzman kendi profilinde ve kendi dosyalarında salt okunur kabul yapmalıdır. Şifre, oturum veya token sohbete istenmez.
- Harici Supabase için bu ortam yönetilen kullanıcı oturumu üretemiyor. Mevcut kullanıcıyla ödeme/bildirim oluşturmadan uzman-belge okuma ve yetkili panel readback kanıtı gerekir. Yerel dört-rol testleri bunun yerine geçmez.

## Banka hareketi bağı: henüz yalnız hesap sahibi işi değil

Mevcut defterde referans, tutar ve yöneticinin `statement_checked=true` beyanı var; banka hesabı/para birimi/işlem tarihi ve doğrulanmış banka kaynak kaydı yok. Yeni bir metin alanı eklemek bu eksikliği çözmez. Banka → kurumsal hesap → hesap hareketleri kaynağı (sağlayıcıdan gelen kayıt veya doğrulanabilir ekstre aktarımı) seçilmeli; uygulamada salt-okunur kaynak alımı, değişmez hareket kaydı, tekil tüketim, hesap/TRY/tutar/tarih/sipariş/uzman kontrolü ve gerçek handler kabulü yapılmalıdır. Bu iç uygulama çalışması tamamlanmadı; kullanıcıya bitmiş iş olarak devredilemez. Mevcut satış/yenileme kayıtları değiştirilmedi.