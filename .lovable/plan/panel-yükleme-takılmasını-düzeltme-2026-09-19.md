# Panel yükleme takılmasını düzeltme

## Yapılacaklar
- Panel sayfası dosyası belirli sürede gelmezse sonsuz yükleme yerine açık bir bağlantı uyarısı göstermek.
- Otomatik yeniden yükleme döngüsünü kaldırmak; kullanıcıya güvenli “Tekrar Dene” seçeneği vermek.
- Panel giriş ve sipariş sayfasını aynı hata korumasına almak.
- Masaüstünde panel girişini ve sipariş adresini doğrulamak.

## Teknik not
- Mevcut oturum korunacak; yalnızca yüklenemeyen sayfa dosyası yeniden istenecek.
- Veritabanı sorguları veya panel yetkileri değiştirilmeyecek.
