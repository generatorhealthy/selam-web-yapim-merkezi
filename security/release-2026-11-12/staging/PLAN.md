# Gerçek test ortamı — üretimden ayrı

Bu proje harici Supabase'e bağlıdır; mevcut bağlantıyı Lovable Cloud'a çevirmeyeceğiz. Sandbox'ta Docker yok; yerel PostgreSQL gerçek SQL yarışlarını doğrular ama Supabase Auth/e-posta/OAuth/Storage değildir.

## Kurulum için kullanıcı kararı ve izin

Yeni, boş bir Supabase test projesi + yalnız test için ayrı önizleme kopyası. Üretim bağlantısı/.env değişmez. Yeni hizmetin maliyeti sağlayıcı planına bağlıdır; oluşturmadan önce kullanıcı onayı gerekir. Üretim veri dump'ı, yedek, storage, telefon/e-posta ve auth kullanıcıları kopyalanmaz. Şema gözden geçirilmiş allowlist ile migration aracından kurulur; üretimdeki cron/mesaj/ödeme tetikleyicileri körlemesine restore edilmez.

Gerekli bağlantılar: test Supabase URL/public key, sunucu servis anahtarı, test SMTP gelen kutusu, Google test OAuth uygulaması ve Apple test hizmet kimliği/callback, CAPTCHA test anahtarları. Özel sırlar yalnız onaylı sır araçlarıyla; sohbet veya frontend içine yazılmaz. Brevo/SMS/WAHA üretim anahtarları bu ortama taşınmaz; outbound varsayılan disabled, izinli sentetik alıcı listesi zorunlu.

## Kabul akışları

1. Web/mobil signup → doğrulama bekler → yalnız test inbox linki → getUser doğrulanmış kimlik.
2. Google/Apple gerçek test hesabı → doğru redirect/PKCE → yeni tercihler → sunucu event.
3. Misafir test → aydınlatma/izin/CAPTCHA → op → cevap → atomik result+outbox → ilgili uzman panelinden readback.
4. Rıza geri çek → yeni olay → aynı health işleminin commit'i reddedilir.
5. Başka uzman/anon → sonuç/işlem/mesaj erişimi reddedilir.
6. Genel randevu sağlık notu olmadan; sağlık açıklaması yalnız scoped consent ile. Üretim bildirimleri kapalı.
7. Yeni mobil cihaz ve eski sürüm kopyası. Önce yayımlanmış minimum sürüm/duyuru/uyumluluk kararı; gerçek eski sürüm başarısı doğrulanmadan doğrudan INSERT revoke yok.

Her adım sentetik hesapla UI sonucunu tekrar okur; yalnız HTTP 200, mocked OAuth, signed-out sayfa veya yerel SQL “uçtan uca tamam” değildir. Apple/Google sağlayıcı kurulumunu, gerçek cihaz/hesabı ve test SMTP bağlantısını kullanıcı sağlamadan bu testler yapılamaz.