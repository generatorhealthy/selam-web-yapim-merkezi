# Safari ve Chrome'daki Kalıcı Sayfa Donmasını Giderme

## Amaç
Sayfaların ayrı JavaScript dosyası yüklenemediğinde iskelette veya hata ekranında kalmasını site ve Divan Paneli genelinde sona erdirmek.

## Yapılacaklar
- Yayın sırasında eski, sürüm numaralı sayfa dosyalarının hemen silinmesini durduracağım; açık sekmeler yeni yayın sonrasında da ihtiyaç duyduğu dosyayı bulacak.
- Safari'nin başarısız bir dosya isteğini bellekte tutması nedeniyle sonuç vermeyen aynı-adres tekrarlarını kaldıracağım.
- Gerçek dosya hatasında yalnızca bir kez yeni belge ve güncel dosya listesiyle açılış yapılacak; beş dakikalık kilit veya yenileme döngüsü oluşmayacak.
- Ana sayfanın ekranda görülen alt bölümünü ayrı dosyadan çıkararak ilk açılışa dahil edeceğim.
- Ana sayfa, uzmanlar ve Divan Paneli'nde kesilen dosya, eski yayın ve doğrudan yenileme senaryolarını doğrulayacağım.

## Teknik ayrıntı
- Hostinger aktarımı eski hash'li `assets` dosyalarını koruyacak; `index.html` önbelleksiz, sürümlü dosyalar değişmez önbellekli kalacak.
- `safeLazy` başarısız ES modülünü aynı URL ile art arda çağırmayacak; Safari module-map reddini yeni belge açılışıyla sıfırlayacak.
- Kurtarma kaydı giriş dosyası ve sayfa yoluna göre tutulacak, manuel tekrar deneme her zaman yeni istek oluşturacak.
