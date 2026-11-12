# Mobil dağıtım paketi — mevcut uygulamanın güncellemesi

## Derleme durumu
Bu depoda iOS altında yalnız GoogleService-Info.plist var; Xcode projesi, AppDelegate.swift ve Info.plist yok. Android proje klasörü ve Gradle wrapper yok. Sandbox'ta Java/Android SDK/Xcode yok. Bu nedenle imzalı IPA/AAB üretilemedi; dağıtıma hazır denemez. Mevcut mağaza uygulamasının appId'si korunur: app.lovable.doktorumol. Yeni uygulama/kimlik/önizleme sunucusu oluşturulmaz.

`node scripts/native-release-preflight.mjs` yalnız okur, eksikleri açıkça gösterir. Kaybolan native kaynakları yeniden üretmek yerine mağazaya son gönderilen tam yerel projeyi dağıtım sorumlusu sağlamalıdır; capabilities, URL schemes, entitlement, signing ve GoogleService yapılandırmaları körlemesine değiştirilemez.

## Yerel derleme ve mağaza sırası
1. Dağıtım sorumlusu bağlı depodaki son kodu mevcut tam yerel native projeye alır. Önce mevcut bundle/package ID, version/build, signing team, keystore ve push entitlement'larını doğrular. Anahtarları depoya koymaz.
2. `bun install` → `npm run build` → `npx cap sync`. dist native cihaz içine paketlenir; server.url eklenmez. Android/iOS platformları mevcut yerel projede yoksa kayıp kaynakların son mağaza sürümünden geri alınması gerekir; otomatik cap add mevcut imza/yeteneklerin yerine geçmez.
3. iOS: Mac/Xcode, `npx cap open ios`; mevcut signing team ve bundle ID; mağzadakinden büyük build numarası; Product → Archive → Validate → TestFlight. Android: Java/Android Studio, `npx cap open android`; mevcut applicationId, keystore ve yüksek versionCode; imzalı release AAB → Play Internal testing. Numara veya sertifika tahmin edilmez.
4. Aşağıdaki gerçek cihaz kontrol listesinin tümü sentetik veri ve dış gönderimleri engelleyen yerel test taşımasıyla geçer. Üretim backend'ine sağlık testi/gerçek ileti gönderilmez. Sentetik web tarayıcı testi cihaz kabulü değildir.
5. TestFlight ve Play internal kabulünün ardından mağaza açıklamaları, veri güvenliği/mahremiyet formu ve ekran görüntüleri gerçek işleyişe göre güncellenir; önce yeni sürüm erişilebilir olur. Sağlık servisi kapalıyken test ekranı başlatmadan durur, diğer hizmetlere erişim devam eder.
6. Yeni sürüm erişilebilirliği doğrulanır; aşağıdaki bilgilendirme planı uygulanır (gönderim için ayrıca açık onay). Eski INSERT kapanması daha sonra ayrı karar ve kabul koşuludur; native derleme/sayfa yayını ile birleştirilmez.

## Gerçek iOS/Android cihaz kabulü (henüz yapılmadı)
- [ ] Son mağaza sürümü ve yeni aday iki platformda version/build ile kayıtlı; yeni sürüm açılışı/oturum dönüşü çalışır.
- [ ] Kapalı servis/ağ hatası: soru, cevap ve kişisel bilgi alanı yok; yanlış başarı yok.
- [ ] Sentetik belgeler: iki seçenek boş; yalnız aydınlatma kabulü sağlık izni değildir; ret diğer hizmetleri engellemez.
- [ ] Doğrulanmamış/oturumsuz hesap başlayamaz; geçerli sentetik izin sunucuda kaydolmadan alan açılmaz.
- [ ] İlgisiz uzman/test eşleşmesi reddedilir; sonuç yalnız ilgili uzman panelinde geri okunur; başka kullanıcı okuyamaz.
- [ ] Eşzamanlı Gönder → tek sonuç; ağ hatası/409/bozuk yanıt başarı oluşturmaz; yanıtlar ekranda korunur.
- [ ] Geri alma ancak withdrawn=true sunucu yanıtında ekranı kapatır; başarısız geri alma yanıtları silmez; sonra gönderim reddedilir.
- [ ] Ekran değiştirme/telefon kilitleme/uygulamayı kapatma etkileri doğrulanır; cevapları kalıcı cihaz deposuna koyma veya otomatik yeniden gönderme yok.
- [ ] Bildirim/ödeme/abonelik akışında değişiklik yok; eski sonuç okuma ve üyelik çalışır.

## Eski kullanıcıya erişilebilen kanallar
Mevcut push token/FCM ve foreground local bildirim desteği var; izin veren ve token'ı kayıtlı cihazlara bildirim ulaşabilir. URL içeren push tıklaması mevcut action listener ile sayfa açabilir. Teslim/okuma/güncelleme zorunlu değildir; internet/izin yoksa ulaşmaz. Doğrudan SMS/e-posta/destek kanalları mevcut; gönderilmedi. Depoda eski cihazın okuyacağı uzaktan sürüm/duyuru servisi yok. Yeni web duyurusu eski paketli uygulamaya otomatik taşınmaz. Hiçbiri cevap ÖNCESİ teknik engelleme garantisi vermez.

Onayla gönderilebilecek genel bilgilendirme (kişisel/sağlık verisi veya sonuç kimliği içermez): “Doktorum Ol uygulamasında test öncesi bilgilendirme güncelleniyor. Teste başlamadan uygulamanızı mağazadan güncelleyin. Güncelleme tamamlanana kadar eski sürümde yeni test başlatmayın. Üyelik ve genel randevu işlemleriniz devam eder.”

Mağaza adresleri: https://apps.apple.com/tr/app/doktorum-ol/id6762599027 ve https://play.google.com/store/apps/details?id=app.lovable.doktorumol. Yeni sürüm hazır olmadan “güncelleme yayımlandı” mesajı gönderilmez.

## Ayrı INSERT kararı
Güvenli, garanti cevap kayıpsız yol: kullanıcı test BAŞLATMADAN yeni sürüme geçer. Eski cihazı uzaktan zorla geçirme garantisi yok. Eski INSERT açık tutulursa eski sürümlerin yeni izni atlaması devam eder; tam sağlık geçişi denemez.

Kapatılırsa eski sürüm cevapları ekranda alabilir; Gönder sonunda 42501 hata, sonuç kaydı ve buna bağlı yeni uzman bildirimi oluşmaz. Uygulama kapanınca cevap kurtarma garantisi yok. Yeni izin işlemi dışındaki servis INSERT'leri de doğrulanmış operasyon olmadan reddedilir. Önce mağaza kabulü/bilgilendirme; sonra bu kesintiye ayrı açık onay gerekir. Eski sonuçlar, üyelik, ödeme, abonelik, sözleşme ve yedekler değişmez. Eski rızayı otomatik üretmek veya başarısız gönderime sahte başarı vermek uygulanmaz.

Capacitor rehberi: https://docs.lovable.dev/tips-tricks/mobile-apps