# Gerçek test ortamı — üretimden ayrı

Bu proje harici Supabase'e bağlıdır; mevcut bağlantıyı Lovable Cloud'a çevirmeyeceğiz. Sandbox'ta Docker yok; yerel PostgreSQL gerçek SQL yarışlarını doğrular ama Supabase Auth/e-posta/OAuth/Storage değildir.

## Kurulum için kullanıcı kararı ve izin

12 Kasım 17:33 talimatı: öncelik mevcut Supabase projesinde üretim verisi içermeyen Branching; bağımsız proje kurulumu bekletildi. Kullanıcı plan/özellik durumunu kontrol edecek; güvenlik planı ve doğrulamadan sonra kurulum kararını verecek. Mevcut Lovable bağlantısı/.env değişmez; şu an hiçbir ortam oluşturma onayı yok. Branch başlangıcındaki tarihsel migration/cron/webhook/Edge Functions yan etkileri ilk çalışmadan önce engellenemiyorsa oluşturma durur. Ayrıntılı kapılar: `BRANCH_PRECREATION_SAFETY_PLAN_2026-11-12.md`. Üretim veri dump'ı, yedek, storage, telefon/e-posta ve auth kullanıcıları kopyalanmaz; Include data kapalıdır.

Gerekli bağlantılar yalnız onaylı kurulumdan sonra: branch Supabase URL/public key, branch'e ait sunucu servis anahtarı, dışarı relay yapmayan test posta kutusu ve CAPTCHA test anahtarları. Google/Apple test OAuth ek kurulumu ayrıca değerlendirilir. Özel sırlar yalnız onaylı sır araçlarıyla; sohbet veya frontend içine yazılmaz. Brevo/SMS/WAHA/ödeme üretim anahtarları taşınmaz; ilk kapsamda bütün dış gönderimler simülatörde kalır, gerçek sağlayıcı bağlantısı açılmaz.

## Kabul akışları

1. Web/mobil signup → doğrulama bekler → yalnız test inbox linki → getUser doğrulanmış kimlik.
2. Google/Apple gerçek test hesabı → doğru redirect/PKCE → yeni tercihler → sunucu event.
3. Misafir test → aydınlatma/izin/CAPTCHA → op → cevap → atomik result+outbox → ilgili uzman panelinden readback.
4. Rıza geri çek → yeni olay → aynı health işleminin commit'i reddedilir.
5. Başka uzman/anon → sonuç/işlem/mesaj erişimi reddedilir.
6. Genel randevu sağlık notu olmadan; sağlık açıklaması yalnız scoped consent ile. Üretim bildirimleri kapalı.
7. Yeni mobil cihaz ve eski sürüm kopyası. Önce yayımlanmış minimum sürüm/duyuru/uyumluluk kararı; gerçek eski sürüm başarısı doğrulanmadan doğrudan INSERT revoke yok.

Her adım sentetik hesapla UI sonucunu tekrar okur; yalnız HTTP 200, mocked OAuth, signed-out sayfa veya yerel SQL “uçtan uca tamam” değildir. Apple/Google sağlayıcı kurulumunu, gerçek cihaz/hesabı ve test SMTP bağlantısını kullanıcı sağlamadan bu testler yapılamaz.