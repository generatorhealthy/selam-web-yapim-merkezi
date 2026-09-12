# Çağrı durumu bağlantı hatasını düzeltme

## Yapılacaklar
- Otomatik durum kontrolünün önceki istek bitmeden yeniden başlamasını engellemek.
- Geçici bağlantı hatalarında mevcut veriyi koruyup sessizce tekrar denemek; her kontrolde kırmızı hata bildirimi göstermemek.
- Kullanıcı elle yenilediğinde kalıcı hata varsa anlaşılır uyarı göstermek.
- Santral erişim kontrolüne kısa süre sınırı ekleyerek tüm durum isteğinin beklemesini önlemek.
- Sonucu derleme kayıtları ve işlev çağrısıyla doğrulamak.

## Teknik ayrıntılar
- Otomatik kontrol yalnızca sayfa görünürken çalışacak ve eşzamanlı tek istekle sınırlandırılacak.
- İlk geçici hatada artan kısa gecikmeyle tekrar denenecek; son başarılı durum ekranda kalacak.
- Santral `/health` isteği ayrı bir kısa zaman aşımına sahip olacak; santral yanıt vermese bile ayarlar ve son aramalar dönecek.
