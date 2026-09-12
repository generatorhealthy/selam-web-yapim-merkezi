# Admin ve staff paneli kararlılık düzeltmesi

## Yapılacaklar
- Girişten hemen sonra aynı yetki bilgisinin ikinci kez sorgulanmasını kaldırarak başarılı oturumun hata ekranına düşmesini önlemek.
- Oturum bilgisini tek merkezde tutmak; admin ve staff kullanıcılarında geçici bağlantı gecikmesinin “yetki yok” gibi değerlendirilmesini engellemek.
- Her tıklama, kaydırma ve pencere odağında çalışan gereksiz veritabanı isteklerini kaldırmak; etkinlik kaydını seyrek ve kontrollü çalıştırmak.
- Uzman Yönetimi ve Danışan Yönlendirme ekranlarında pencere odağı değişince tüm verinin yeniden indirilmesini durdurmak.
- Veritabanında en sık kullanılan yönlendirme ve sipariş sorgularını inceleyip yalnızca eksik olan hedefli indeksleri eklemek.
- Admin ve staff oturumlarıyla giriş, panel kartları, uzmanlar, siparişler, müşteriler ve yönlendirme ekranlarını gerçek tarayıcı akışında doğrulamak.

## Teknik ayrıntılar
- Geçerli profil 60 saniyelik ortak önbellekten kullanılacak; yalnızca kullanıcı bilgisi gerçekten değiştiğinde zorunlu yenileme yapılacak.
- Yerel oturum okumasına kısa zaman aşımı uygulanmayacak; uzak profil sorgusu sınırlı süreli kalacak.
- Site etkinlik güncellemesi kullanıcı hareketi başına değil, görünür sekmede en fazla beş dakikada bir yapılacak.
- Sayfa veri istekleri hata alsa bile yükleme göstergeleri kesin olarak kapanacak ve mevcut oturum korunacak.
- Veritabanı değişiklikleri mevcut erişim kurallarını genişletmeyecek; yalnızca sorgu hızını iyileştirecek.
