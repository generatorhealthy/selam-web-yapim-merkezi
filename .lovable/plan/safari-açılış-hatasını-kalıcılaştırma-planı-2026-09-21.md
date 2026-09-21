# Safari açılış hatasını kalıcılaştırma planı

## Yapılacaklar
- Safari’nin `Load failed` ve benzeri dosya yükleme hatalarını eski sürüm hatası olarak doğru tanıyacağım.
- Güncel sürüme geçişi yalnızca adres yenilemek yerine tarayıcının uygulama önbelleğini temizleyip güncel belgeyi zorla alacak şekilde güçlendireceğim.
- Panel sayfası indirilemediğinde kullanıcıyı hata ekranında bırakmadan güvenli bir otomatik kurtarma denemesi yapacağım; tekrar döngüsünü engelleyeceğim.
- Chrome ve Safari davranışını temsil eden açılış, yenileme ve panel kartı geçişlerini doğrulayacağım.

## Teknik ayrıntı
- Hata tanıma kapsamına Safari/WebKit mesajları eklenecek.
- Kurtarma işlemi rota ve zaman penceresiyle sınırlandırılacak; kalıcı uygulama hataları sonsuz yenilemeye dönüşmeyecek.
- Sunucu tarafındaki HTML için önbelleksiz teslim kuralları korunacak.
