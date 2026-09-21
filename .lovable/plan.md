# Süresiz yükleme sorununu kaldırma

## Amaç
Safari ve Chrome'da sayfanın dönerek süresiz beklemesini sona erdirmek; açılış başarısızsa otomatik toparlanmak ve kullanıcıyı boş ekranda bırakmamak.

## Yapılacaklar
- Dinamik sayfa dosyası isteği yanıt vermeden beklerse kesin süre sınırı uygulamak; yalnızca reddedilen değil, askıda kalan indirmeleri de yakalamak.
- Otomatik güncelleme denemesini tek ve kontrollü hale getirerek yeniden yükleme döngüsünü önlemek.
- Ana site ve Divan Paneli için tüm bekleme durumlarını süreli yapmak; süre aşımında görünür “Tekrar Dene” seçeneği göstermek.
- Panel yetki isteği başarılı olduğu halde ekranı bekleten dosya indirmesini yetki akışından ayırmak.
- Chrome ve Safari davranışlarını taklit eden testlerle ana sayfa, panel girişi, panel yenileme ve kart geçişlerini doğrulamak.

## Teknik ayrıntılar
- `safeLazy` içindeki dinamik import, zaman aşımıyla yarışacak; zaman aşımı da dosya yükleme hatası olarak mevcut kurtarma akışına girecek.
- Kurtarma anahtarı URL sürümüyle ilişkilendirilecek; aynı bozuk sürüm tekrar tekrar yenilenmeyecek, yeni sürüm ise eski 5 dakikalık kilide takılmayacak.
- `Suspense` bekleme görünümü süre aşımı denetimi alacak; hiçbir Promise sonsuza kadar tüm ekranı kapatamayacak.
- Mevcut oturum ve panel yetki önbelleği korunacak; başarılı `get_my_panel_access` çağrısı tekrar edilmeyecek.

## Doğrulama
- Kod kontrolü ve mevcut testler.
- Chromium üzerinde ana site ile `/divan_paneli` açılış/yenileme.
- Askıda kalan dinamik import simülasyonu: süre sonunda kontrollü kurtarma veya hata ekranı.
- Güncel hata kayıtlarında derleme ve çalışma zamanı hatası bulunmadığını doğrulama.
