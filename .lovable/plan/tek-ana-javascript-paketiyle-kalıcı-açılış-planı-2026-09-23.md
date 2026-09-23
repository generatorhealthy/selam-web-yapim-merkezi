# Tek ana JavaScript paketiyle kalıcı açılış planı

## Amaç
React sayfalarının ayrı JavaScript dosyaları istemesini tamamen kaldırmak; eski tarayıcı oturumlarının yayın sonrasında silinmiş `index-xxx.js` veya sayfa parçasına takılmasını önlemek.

## Yapılacaklar
- `App` içindeki tüm `safeLazy(() => import(...))`, `React.lazy`, ortak `Suspense` ve sayfa yükleme iskeletini kaldırıp bütün yolları normal statik importlarla bağla.
- Divan Paneli çalışma alanını da uygulama köküne statik bağla; panel giriş, ana ekran ve bütün kartlar aynı JavaScript paketi içinde olsun.
- Yardımcı özelliklerde kalan dinamik JavaScript importlarını derleme sırasında aynı ana pakete dahil edecek şekilde Vite çıktısını tek dosyaya zorla.
- Ana JavaScript dosyasına hash yerine sabit bir ad ver ve bu dosya için tarayıcı/CDN önbelleğini kapat. Böylece yeni yayında eski HTML artık silinmiş hash'li bir JavaScript adı istemesin.
- Artık oluşmayacak parça yükleme hatalarına yönelik `safeLazy` bağımlılığını ve otomatik yenileme döngüsünü kaldır; gerçek başlangıç ağı hatasında kullanıcıya kontrollü tek tekrar seçeneği bırak.
- Yol haritasındaki önceki hibrit/parçalı yükleme kararını bu nihai tek-paket kararıyla değiştir.

## Doğrulama
- Kaynakta sayfa rotalarını bölen `React.lazy`, `safeLazy` ve dinamik sayfa importu kalmadığını kontrol et.
- Üretim çıktısında yalnızca bir uygulama JavaScript dosyası oluştuğunu ve HTML'in sabit adlı dosyayı çağırdığını doğrula.
- Ana site, uzmanlar, Divan Paneli giriş, kontrol paneli, siparişler, uzmanlar, hızlı kayıt ve kullanıcılar yollarını masaüstü tarayıcıda yenileme ve geçişlerle test et.
- Son derleme, tarayıcı konsolu ve hata kayıtlarını kontrol et.

## Teknik not
Tek ana paket ilk açılış indirmesini ve tarayıcının derleme süresini büyütür. Buna karşılık sayfalar arasında ek JavaScript isteği ve yayın sonrası eksik chunk riski kalmaz. Ağ tamamen kesilirse hiçbir web uygulaması dosyayı indiremez; bu değişiklik silinmiş sürümlü dosyadan kaynaklanan 404 ve yenileme döngüsünü hedefler.
