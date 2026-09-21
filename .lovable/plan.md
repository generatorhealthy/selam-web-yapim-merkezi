# Chunk yükleme hatasını kalıcılaştırma planı

## Yapılacaklar
- Tüm sayfa bazlı dinamik yüklemeleri tek bir güvenli yükleyici üzerinden çalıştıracağım; ağ veya eski dosya hatasında kısa bir yeniden denemeden sonra yalnızca bir kez güncel adresle tam sayfa yenilemesi yapılacak.
- Yenileme başarısız olur ya da aynı hata tekrar ederse boş ekran yerine “Yeni bir güncelleme mevcut” mesajı ve çalışan bir yenileme düğmesi gösterilecek.
- Vite çıktılarında sayfa, ortak paket ve diğer dosya adlarına içerik hash’i eklenerek eski ve yeni yayın dosyalarının karışması önlenecek.
- Panel ve genel site içindeki bütün `React.lazy` kullanımlarını tarayıp güvenli yükleyici dışında kalanları düzelteceğim.
- Safari/Chrome benzeri dinamik import hatasını test ortamında tetikleyerek otomatik yenileme, döngü koruması ve görünür hata ekranını doğrulayacağım.

## Teknik notlar
- Yenileme döngüsü oturum bazlı zaman damgasıyla sınırlandırılacak.
- Önbellek temizliği yenilemeyi süresiz bekletemeyecek; kısa bir üst süre sonunda doğrudan yenileme gerçekleşecek.
- Üretilen dosya şablonları `assets/[name]-[hash].js` ve eşdeğer hash’li varlık adları olacak.
