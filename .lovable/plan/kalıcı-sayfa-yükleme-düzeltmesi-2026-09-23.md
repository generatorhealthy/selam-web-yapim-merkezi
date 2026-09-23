# Kalıcı sayfa yükleme düzeltmesi

## Yapılacaklar
- Uygulama ve Divan Paneli yollarındaki tüm sayfaları statik importlarla tutup üretimde tek `assets/app.js` çıktısını koruyacağım.
- `index.html`, panel yolları ve `app.js` için sunucu önbelleğini tamamen kapatacağım; HTML içine de uyumlu önbellek engelleme etiketleri ekleyeceğim.
- Açılışı 30 saniye sonra zorla kesen “Sayfa bağlantısı yenileniyor” ekranını ve otomatik/özel yenileme mantığını kaldıracağım.
- Genel hata yakalamayı yalnız gerçek çalışma hataları için sade, yenileme döngüsü oluşturmayan bir koruma olarak bırakacağım.
- Ana sayfa ve Divan Paneli yollarını masaüstü tarayıcıda doğrulayacağım.

## Teknik ayrıntı
- `React.lazy()` ve `import()` kullanımlarının kaynak kodunda kalmadığını denetleyeceğim.
- Vite üretim çıktısında `inlineDynamicImports: true` ve sabit `assets/app.js` adı kullanılacak.
- Apache kurallarında HTML ve `app.js` yanıtları `no-store, no-cache, must-revalidate, max-age=0` olacak.
