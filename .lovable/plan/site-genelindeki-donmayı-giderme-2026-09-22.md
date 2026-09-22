# Site genelindeki donmayı giderme

## Yapılacaklar
- Safari’de sayfa dosyası isteği yanıt vermeden askıda kaldığında bunu otomatik algıla.
- İnternet gerçekten kesikse sayfayı bozma; bağlantı geri gelene kadar mevcut indirmeyi sürdür.
- Site sunucusu erişilebilir olduğu hâlde dosya isteği takılı kaldıysa önbelleği atlayarak sayfayı bir kez otomatik yenile.
- Otomatik kurtarmayı döngüye girmeyecek şekilde sınırla; kullanıcıya manuel tekrar seçeneğini koru.
- Ana sayfa ve panel sayfalarını ağ kesintisi/geri gelişi senaryosunda kontrol et.

## Teknik detay
- `safeLazy` içinde yalnızca askıda kalan dinamik dosya istekleri için bir izleyici kullanılacak; indirme 8 saniyede iptal edilmeyecek.
- Yenilemeden önce aynı alan adına küçük bir kontrol isteği yapılacak; Supabase erişim hatası tek başına sayfayı yenilemeyecek.
- Mevcut sürüm bazlı yenileme kilidi korunarak sonsuz yenileme engellenecek.
