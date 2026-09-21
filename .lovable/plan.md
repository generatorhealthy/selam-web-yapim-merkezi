# Yenilemede Donan Panel Sayfasını Düzeltme

## Yapılacaklar
- Ekrandaki “Hızlı Kayıt (AI)” sayfasını yenileme sırasında ayrı bir sayfa dosyası beklemeyecek şekilde ana panel paketine alacağım.
- Sayfa dosyası yüklemesinin Safari’de askıda kalması durumunda beklemeyi sonsuza taşımayan mevcut kurtarma davranışını koruyacağım.
- Sayfayı doğrudan adresinden yenileyerek görünümün açıldığını ve hata kayıtlarının temiz olduğunu doğrulayacağım.

## Teknik ayrıntı
- `QuickRegister` dinamik yükleme yerine doğrudan içe aktarılacak; diğer panel sayfalarının yükleme düzeni değişmeyecek.
- Böylece bu sayfada yenileme sırasında oluşan ek JavaScript dosyası isteği ortadan kalkacak.
