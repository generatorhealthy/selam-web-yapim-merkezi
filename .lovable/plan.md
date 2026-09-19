# Safari panel yükleme hatasını kalıcı düzeltme

## Amaç
Safari'nin eski sayfa sürümünden artık bulunmayan JavaScript dosyasını istemesi nedeniyle oluşan “Sayfa bağlantısı gecikti” hatasını gidermek.

## Yapılacaklar
- Panel dosyası yüklenemezse aynı eski adresi tekrar denemek yerine, sayfayı tek seferlik benzersiz bir adresle güncel sürümden açmak.
- Sonsuz yenileme döngüsünü önlemek ve kullanıcıya yeniden deneme seçeneğini korumak.
- Ana HTML belgesinin Safari dahil hiçbir tarayıcıda eski sürümde tutulmamasını sağlamak; sürüm numaralı dosyaların uzun önbelleğini korumak.
- Safari benzeri eski dosya hatasını tarayıcı testiyle canlandırıp kurtarma davranışını doğrulamak.

## Teknik not
Ekrandaki 403 analiz kaydı asıl sorun değil. Asıl hata `Importing a module script failed`; eski ana sayfa, yayından kaldırılmış sürüm numaralı bir dosyayı çağırıyor.
