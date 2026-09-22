# Tarayıcıdan Bağımsız Panel Donmasını Giderme

## Amaç
Panel kartlarının ayrı sayfa dosyası beklerken iskelet ekranda kalmasını kaldırmak ve eski çalışan paneldeki kararlı açılış davranışını geri getirmek.

## Yapılacaklar
- Eski çalışan paneldeki tek paketli açılışı geri getireceğim; Siparişler, Hızlı Kayıt ve diğer panel kartları geçiş sırasında yeni dosya indirmeyecek.
- Ana siteyi ağırlaştırmamak için panel paketini yalnızca Divan Paneli açıldığında yükleyeceğim.
- Panel yetkisini aynı anda yalnız bir kez alıp başarılı sonucu oturum boyunca kullanacağım; ağ geri geldiğinde ikinci bir istek başlatılmayacak.
- Süresiz iskelet ekranını kaldırıp gerçek bir hata oluşursa kontrollü tekrar deneme sunacağım.

## Teknik ayrıntılar
- `AdminWorkspace` içindeki kart sayfaları doğrudan içe aktarılacak; uygulama kökünde panel çalışma alanı tek bir ayrı paket olarak tutulacak.
- İç içe panel `Suspense` sınırı kaldırılacak; panel kartları arasında parça indirme zinciri kalmayacak.
- Mevcut yetki ve rol kuralları değişmeyecek.

## Doğrulama
- Ana site ile Divan Paneli açılış paketlerinin birbirinden ayrıldığını kontrol edeceğim.
- Gerçek oturumla panel ana ekranı, Siparişler ve Hızlı Kayıt yenileme/geçişlerini test edeceğim.
- Son hata kayıtlarını ve tarayıcı konsolunu doğrulayacağım.
