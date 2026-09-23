# Divan Paneli tek paket yükleme planı

## Amaç
Divan Paneli içindeki kartların ayrı JavaScript dosyaları istemesini kaldırarak, yayın sonrasında eski kart dosyalarından kaynaklanan `ChunkLoadError / Sayfa modülü yüklenemedi` hatalarını önlemek.

## Yapılacaklar
- `AdminWorkspace` içindeki 61 panel sayfasını dinamik `safeLazy(() => import(...))` yerine statik import ile bağla.
- Panel içindeki `Suspense` ve kart yükleme iskeletini kaldır; kart geçişlerini ek indirme olmadan doğrudan aç.
- Ana siteyi gereksiz büyütmemek için Divan Paneli çalışma alanını ana uygulamadan ayrı tek bir panel paketi olarak tut. Böylece panel açılırken bir kez yüklenir, kartlar arasında yeni dosya çağrılmaz.
- Mevcut genel hata korumasını ve güncel sürüme geçiş mekanizmasını panel paketinin ilk yüklemesinde oluşabilecek gerçek ağ hataları için koru.
- Yol haritasındaki çelişkili eski panel yükleme maddesini yeni nihai kararla güncelle.

## Doğrulama
- Panel paketinde kart başına dinamik import kalmadığını kontrol et.
- Panel girişini, kontrol panelini, siparişler, uzmanlar, hızlı kayıt ve kullanıcılar sayfalarını yenileme ve kart geçişleriyle test et.
- Tarayıcı konsolunda modül yükleme hatası olmadığını ve son derlemenin hatasız olduğunu doğrula.

## Teknik not
Bu yaklaşım panelin ilk açılış dosyasını büyütür; ancak yalnızca Divan Paneli açıldığında indirilir. Karşılığında panel içindeki tüm kartlar aynı sürümlü dosyada bulunur ve kart geçişlerinde eski/eksik parça dosyası riski ortadan kalkar.
