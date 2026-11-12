# Üç hukuki metin — yayın öncesi içerik ve bağlantı denetimi

12 Kasım 2026. Kullanıcının yayına alma talimatı yalnız hukuki sayfalar/bağlantılar içindir. Çözülemeyen hukuki belirsizliklerde yayından önce yeniden onay/bilgi istenmesi şartı uygulanmıştır. **Üç kamu sayfası henüz güncellenmedi; yayın yapılmadı.**

## Hazırlanan yayın adayları

`src/content/legal/2026-11-12-yayin-adayi-v4/` içinde v2 esas alınarak üç metin, SHA256SUMS ve manifest hazırlandı. Yayın tarihi boş; hazırlık tarihi 12.11.2026, sürüm `2026-11-12-yayin-adayi-v4`. Yanlış bir yayın tarihi veya yeni geçmiş onay ilişkisi oluşturulmadı. Önizleme `/kvkk-taslak/aydinlatma-metni`, `/kvkk-taslak/acik-riza`, `/kvkk-taslak/cagri-merkezi` üzerinden; yalnız localhost/editör preview, noindex/nofollow.

Şirket unvanı, MERSİS 0309075357800001, adres, info@doktorumol.com.tr, doktorumol@hs01.kep.tr ve internet sitesi üçünde yer alır. VERBİS numarası/muafiyet eklenmedi.

### İçerik düzeltmeleri
- Doğrulanmamış Almanya/Railway altyapı iddiaları çıkarıldı; sağlayıcılar ve yurt dışı aktarım gizlenmedi.
- m.5 genel veri ve m.6 sağlık verisi şartları ayrıldı; genel rıza düzenli yurt dışı aktarım güvencesi gibi sunulmadı.
- Sesin teknik işlenmesi, yazılı döküm saklama ve santral kalıcı ses kaydı ayrıldı; “ses kaydı tutulmaz” denmedi.
- Mevcut olmayan izin yönetimi, otomatik imha ve doğrulanmamış İYS entegrasyonu mevcut özellik olarak gösterilmedi.
- Test cevaplarının Brevo'ya ve ad/test başlığının SMS/push'a mevcut aktarımı açıklandı; hedeflenen güvenlik sistemi mevcutmuş gibi yazılmadı.
- Açık Rıza sayfasının yalnız belge olması ve görüntüleme/işaretsiz örneklerin yeni rıza kaydı oluşturmaması belirtildi; gerçek izin kutusu/kayıt mekanizması eklenmedi.

### Analitik denetimi
index.html bütünü, CookieConsent, AnalyticsTracker, metaPixel, leadTracking ve SeoEngagementTracker okundu. Yayın ayarları: Visitor analytics ve click tracking açık. Lovable çerezsiz ölçüm, cihazda kayıt/IP saklamama, 90 gün ayrıntı/1 yıl özet, sayfa/hız/hata/tıklama, Lovable gizlilik bağlantısı açıklaması eklendi. `window.__lovableEvents` kullanımı bulunmadı.

Mevcut çerez bandı Google Consent Mode'a tercih iletmiyor; Lovable tıklamalarının kabulü beklediği iddia edilmedi. GA4/Ads ve kendi Supabase ölçümleri için kaynakta onay kapısı yok; Meta Pixel'in üretimde kabul kapısı var. Auth/localStorage, atıf kayıtları, sessionStorage, Google Fonts ve mobil Google harita bağlantısı ayrıldı. Bu çalışma analytics ayarlarını veya tracker kodunu değiştirmedi; uyum beyanı yapılmadı. Canlı sağlayıcı çerezlerinin bütün süreleri browser envanteriyle doğrulanmış değildir.

## Yayından önce gereken bilgi/onay

1. **Klasik santral:** Kalıcı ses kaydı açık mı? Varsa amaç, erişen/alıcılar, hukuki sebep ve süre nedir? SSH/sağlayıcı kanıtı yok; yalnız metin değiştirmek bunu çözmez.
2. **Sağlık faaliyetleri:** Test, sağlık açıklamalı randevu/yönlendirme ve AI görüşmesi için uygulanacak somut KVKK m.6 şartı hukukça belirlenmeli. “Uygulanabilir şart” yazmak faaliyetin hukuki sebebini açıklamayı tamamlamaz. Mevcut ayrı izin geçişi tamamlanmadı.
3. **Yurt dışı aktarım:** Sağlayıcı/alt işleyen/ülke ve somut KVKK m.9 mekanizması, varsa imza/bildirim belgeleri gerekiyor. Genel rıza yeterli varsayılmadı; imzalanmış sözleşme bulunduğu iddia edilmedi.
4. **Saklama/imha:** Kategori bazlı süre/kriter ve fiilen yürütülen başvuru/imha prosedürü gerekiyor; otomatik silme yoksa var yazılmayacak. İzin geri çekme talebini kimin nasıl yerine getirdiği netleşmeli.
5. **Mevcut dış sağlık bildirimleri/ölçüm:** Yayın adayının mevcut eksikleri açıkça anlatan bölümleri onayınıza sunulmalı; bu belge yayını güvenlik açığını veya hukuki aktarım şartını düzeltmez. Bu kapsamda test/bildirim/çerez akışını değiştirme yetkisi yok.

Bu bilgilerin yerine tahmin veya kullanıcı adına hukuki güvence üretilmedi. Üç sayfa birlikte güncellenecekse bu kapılar kapatılmalı veya açık sınırlamaları taşıyan içerik için açık hukuki karar alınmalıdır; böyle bir karar sistem uyumunun kanıtı değildir.

## Bağlantılar ve yayın hazırlığı

- Ana adresler `/aydinlatma-metni` ve `/acik-riza` korunacak.
- `/disclosure-text` ve `/explicit-consent` halen App route eşleri; public/.htaccess 301 eşleştirmeleri de var. Kayıt/CookieConsent/footer bu eşleri kullanıyor; kırık değiller.
- Çağrı metni halen Aydınlatma sayfasının içinde. Ayrı `/cagri-merkezi-aydinlatma-metni` adresi şu anda route/prerender/.htaccess allowlist'te yok. Yayın onayı sonrası aynı kurumsal görünümle eklenmeli; eski Aydınlatma adresi korunmalı ve çağrı sayfasına bağlantı verilmeli.
- Footer'da Aydınlatma var, Açık Rıza ve ayrı Çağrı bağlantıları yok; birlikte yayın adımında eklenecek. Privacy/çerez bağlantıları korunacak.
- Yeni çağrı adresi prerender listesi ve .htaccess ayrılmış public route listesine eklenmeli; aksi hâlde uzman slug yönlendirmesi riski var. Hukuki HTML metni sürümlü markdown'dan okunmalı; yalnız JSX kaynak kazımasına bağlı kalınmamalı.
- Bu tur kamu footer'ı, App route'ları, kayıt/randevu/test/iletişim formları veya prerender değiştirilmedi; çalışmayan çağrı linki kamuya eklenmedi. Yeni adaylarda yer alan çağrı linki yayın sonrası hedefidir, mevcutta aktif kamu adresi olduğu iddia edilmez.

## Arşiv/delil ve geri alma

Mevcut DisclosureText.tsx ve ExplicitConsent.tsx arşivdeki birebir sürümleriyle SHA256 eşleşiyor:
- DisclosureText: `95a08f63474308b658b2c21a644228b97d531786b3496f84ea83f9a3000ed3e8`
- ExplicitConsent: `65bf11637dbeb6645b3ff25516cb69d411a3df1fa779cd59c5d3f3151d6fee8b`

v1/v2/v3 ve yayındaki arşiv korunuyor. Yeni aday SHA256SUMS dosyası her üç tam metni kapsar. Yeni aday henüz geçmiş 57 kayda bağlanmaz; hiçbir onay/sözleşme/veritabanı kaydı değiştirilmez. Yayın sonrasında ayrı yayın manifest'ine gerçek zaman/sürüm/hash yazılmalı; aday manifest'inde published_at null.

Geri alma: yalnız hukuki sayfa sürümü/bağlantıları önceki arşiv sürümüne alınabilir; arşiv silinmez, tarihçe ve yeni yayın hash'i korunur. Veri/izin/ödeme değişikliği bu paket kapsamı değildir.

## Doğrulama sınırı

Kaynak/bağlantı/arşiv ve yayın ayarı denetimleri yapıldı. Üç aday 1280×1800 masaüstü ve 457×926 mobil boyutlarında Chromium'da açıldı; altı görüntü incelendi, başlıklar ve şirket bilgileri okunur, yatay taşma yok ve noindex/nofollow mevcut. Mevcut çerez bandı altta içeriğin üstüne oturuyor; kapatılınca okuma devam eder, bu çalışmada bandın davranışı/tasarımı değiştirilmedi. Ana kamu yolları ve İngilizce eşleri yerelde açıldı; eski metin korunuyor. v2, yeni aday ve eski yayındaki arşiv SHA256 özetlerinin tamamı doğrulandı. Browser sırasında Supabase yazım istekleri engellendi; gerçek veri işlemi yapılmadı.

Gerçek kamu adreslerinde yeni metin doğrulaması henüz yapılamaz: yayımlanmadı. Ödeme/abonelik/randevu/kayıt kodları değiştirilmedi; bunlar gerçek işlemle tekrar test edilmedi, etkilenmediğine ilişkin üretim E2E iddiası yok. Hukuki uygunluğun tamamlandığı söylenmiyor.